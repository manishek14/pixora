import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { ReelViewEntity } from './entities/reel-view.entity';
import { CreateReelInput } from './dto/create-reel.input';

@Injectable()
export class ReelsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ReelViewEntity)
    private readonly viewRepo: Repository<ReelViewEntity>,
  ) {}

  /**
   * Create a new reel (a Post with isReel=true + reel-specific fields).
   * Hashtags and mentions are auto-extracted from caption if not provided.
   */
  async create(authorId: string, input: CreateReelInput): Promise<PostEntity> {
    let hashtags = input.hashtags || [];
    if (input.caption && hashtags.length === 0) {
      const matches = input.caption.match(/#[\w\u0600-\u06FF]+/g);
      if (matches) hashtags = matches.map((h) => h.slice(1).toLowerCase());
    }

    let mentions = input.mentions || [];
    if (input.caption && mentions.length === 0) {
      const matches = input.caption.match(/@[\w_.]+/g);
      if (matches) mentions = matches.map((m) => m.slice(1).toLowerCase());
    }

    const reel = this.postRepo.create({
      caption: input.caption,
      mediaUrls: [input.videoUrl],
      hashtags,
      mentions,
      location: input.location,
      isReel: true,
      videoUrl: input.videoUrl,
      audioTrack: input.audioTrack,
      durationSeconds: input.durationSeconds,
      authorId,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      sharesCount: 0,
      archived: false,
    });

    const saved = await this.postRepo.save(reel);
    return (await this.postRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    })) as PostEntity;
  }

  /**
   * Trending reels feed, ranked by an engagement score
   * (likes + 2*comments + 0.1*views) and recency decay.
   * Excludes archived reels.
   */
  async getFeed(viewerId: string, limit = 20, offset = 0): Promise<PostEntity[]> {
    // Pull candidate reels (last 200 most recent), then rank in-memory.
    // For a real system we'd precompute a trending score in DB.
    const candidates = await this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.isReel = :isReel', { isReel: true })
      .andWhere('p.archived = :archived', { archived: false })
      .orderBy('p.createdAt', 'DESC')
      .take(200)
      .getMany();

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const scored = candidates.map((r) => {
      const ageHours = (now - r.createdAt.getTime()) / HOUR;
      const recencyDecay = 1 / (1 + ageHours / 24); // half-life ~24h
      const engagement =
        r.likesCount + 2 * r.commentsCount + 0.1 * r.viewsCount;
      return { reel: r, score: engagement * recencyDecay };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(offset, offset + limit).map((s) => s.reel);
  }

  async getById(reelId: string): Promise<PostEntity> {
    const reel = await this.postRepo.findOne({
      where: { id: reelId, isReel: true },
      relations: ['author'],
    });
    if (!reel || reel.archived) {
      throw new NotFoundException('reel not found');
    }
    return reel;
  }

  async getByUser(userId: string, limit = 20, offset = 0): Promise<PostEntity[]> {
    return this.postRepo.find({
      where: { authorId: userId, isReel: true, archived: false },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getByHashtag(tag: string, limit = 20, offset = 0): Promise<PostEntity[]> {
    const normalized = tag.toLowerCase().replace(/^#/, '');
    return this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where(
        `(p.hashtags = :exact OR p.hashtags LIKE :startWith OR p.hashtags LIKE :endWith OR p.hashtags LIKE :middle)`,
        {
          exact: normalized,
          startWith: `${normalized},%`,
          endWith: `%,${normalized}`,
          middle: `%,${normalized},%`,
        },
      )
      .andWhere('p.isReel = :isReel', { isReel: true })
      .andWhere('p.archived = :archived', { archived: false })
      .orderBy('p.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  /**
   * Idempotent view tracking: only the FIRST view by a user increments
   * the reel's viewsCount. Re-watches insert nothing (unique constraint).
   */
  async view(viewerId: string, reelId: string): Promise<PostEntity> {
    const reel = await this.getById(reelId);

    const existing = await this.viewRepo.findOne({
      where: { reelId, userId: viewerId },
    });
    if (!existing) {
      await this.viewRepo.save(
        this.viewRepo.create({ reelId, userId: viewerId }),
      );
      await this.postRepo.increment({ id: reelId }, 'viewsCount', 1);
    }
    // Return fresh reel so viewsCount reflects the new view
    return this.getById(reelId);
  }

  /**
   * Share action — increments sharesCount. Idempotency is intentionally
   * NOT enforced (each share click counts).
   */
  async share(reelId: string): Promise<PostEntity> {
    await this.getById(reelId); // existence check
    await this.postRepo.increment({ id: reelId }, 'sharesCount', 1);
    return this.getById(reelId);
  }

  async delete(reelId: string, authorId: string): Promise<boolean> {
    const reel = await this.getById(reelId);
    if (reel.authorId !== authorId) {
      throw new ForbiddenException('not allowed to delete this reel');
    }
    await this.postRepo.remove(reel);
    return true;
  }

  async getViewers(authorId: string, reelId: string): Promise<ReelViewEntity[]> {
    const reel = await this.getById(reelId);
    if (reel.authorId !== authorId) {
      throw new ForbiddenException('only the author can view reel viewers');
    }
    return this.viewRepo.find({
      where: { reelId },
      relations: ['user'],
      order: { viewedAt: 'DESC' },
    });
  }

  /**
   * Used by Likes/Comments modules — bumps likesCount on the reel (Post).
   */
  async incrementLikes(reelId: string, by = 1): Promise<void> {
    await this.postRepo.increment({ id: reelId, isReel: true }, 'likesCount', by);
  }

  async decrementLikes(reelId: string, by = 1): Promise<void> {
    await this.postRepo.decrement({ id: reelId, isReel: true }, 'likesCount', by);
  }

  async incrementComments(reelId: string, by = 1): Promise<void> {
    await this.postRepo.increment(
      { id: reelId, isReel: true },
      'commentsCount',
      by,
    );
  }

  async decrementComments(reelId: string, by = 1): Promise<void> {
    await this.postRepo.decrement(
      { id: reelId, isReel: true },
      'commentsCount',
      by,
    );
  }
}
