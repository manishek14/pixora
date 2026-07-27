import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Brackets } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { UserEntity } from '../users/user.entity';
import { FollowsService } from '../follows/follows.service';
import {
  ExplorePostsResult,
  HashtagTrend,
  SuggestedUser,
} from './explore-types';

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly follows: FollowsService,
  ) {}

  /**
   * Mixed trending feed of both posts AND reels, ranked by engagement score
   * (likes + 2*comments + 0.1*views for reels, 0 for posts) with recency decay.
   */
  async getExploreFeed(
    limit = 30,
    offset = 0,
  ): Promise<ExplorePostsResult> {
    const candidates = await this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.archived = :archived', { archived: false })
      .orderBy('p.createdAt', 'DESC')
      .take(200)
      .getMany();

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const scored = candidates.map((p) => {
      const ageHours = (now - p.createdAt.getTime()) / HOUR;
      const recencyDecay = 1 / (1 + ageHours / 24);
      const engagement =
        p.likesCount + 2 * p.commentsCount + 0.1 * (p.viewsCount || 0);
      return { post: p, score: engagement * recencyDecay };
    });

    scored.sort((a, b) => b.score - a.score);
    const items = scored.slice(offset, offset + limit).map((s) => s.post);

    return {
      items,
      hasMore: offset + limit < scored.length,
    };
  }

  /**
   * Top reels by engagement score over the last 7 days.
   */
  async getTrendingReels(limit = 20): Promise<PostEntity[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reels = await this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.isReel = :isReel', { isReel: true })
      .andWhere('p.archived = :archived', { archived: false })
      .andWhere('p.createdAt >= :since', { since })
      .orderBy('p.viewsCount', 'DESC')
      .addOrderBy('p.likesCount', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
    return reels;
  }

  /**
   * Top posts (non-reel) by likes over the last 7 days.
   */
  async getTrendingPosts(limit = 20): Promise<PostEntity[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.isReel = :isReel', { isReel: false })
      .andWhere('p.archived = :archived', { archived: false })
      .andWhere('p.createdAt >= :since', { since })
      .orderBy('p.likesCount', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Trending hashtags over the last 7 days, by total post+reel count.
   * Hashtags are stored as simple-array (comma-separated), so we parse them
   * in-memory after fetching recent non-empty rows.
   */
  async getTrendingHashtags(limit = 10): Promise<HashtagTrend[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.postRepo
      .createQueryBuilder('p')
      .select(['p.hashtags', 'p.isReel'])
      .where('p.archived = :archived', { archived: false })
      .andWhere('p.createdAt >= :since', { since })
      .andWhere('p.hashtags != :empty', { empty: '' })
      .andWhere('p.hashtags IS NOT NULL')
      .getMany();

    const counter = new Map<string, { posts: number; reels: number }>();
    for (const row of rows) {
      const isReel = !!row.isReel;
      for (const tag of (row.hashtags || []).filter(Boolean)) {
        const key = tag.toLowerCase();
        const cur = counter.get(key) || { posts: 0, reels: 0 };
        if (isReel) cur.reels += 1;
        else cur.posts += 1;
        counter.set(key, cur);
      }
    }

    return Array.from(counter.entries())
      .map(([tag, counts]) => ({
        tag,
        postsCount: counts.posts,
        reelsCount: counts.reels,
        total: counts.posts + counts.reels,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Suggested users to follow — users not currently followed by the current
   * user, ranked by mutual-followers count, then by post count.
   */
  async getSuggestedUsers(
    userId: string,
    limit = 10,
  ): Promise<SuggestedUser[]> {
    const followingIds = await this.follows.getFollowingIds(userId);
    const excludeIds = [userId, ...followingIds];

    // candidate users
    const candidates = await this.userRepo.find({
      where: { id: Not(In(excludeIds)) },
      take: 100,
    });

    // get current user's followers (their IDs) — these are the "mutuals"
    const myFollowers = await this.follows.getFollowers(userId);
    const myFollowerIds = new Set(myFollowers.map((u) => u.id));

    // For each candidate, count mutual followers and posts.
    const suggestions: SuggestedUser[] = [];
    for (const candidate of candidates) {
      const candidateFollowers = await this.follows.getFollowers(candidate.id);
      const mutual = candidateFollowers.filter((u) =>
        myFollowerIds.has(u.id),
      ).length;

      const postsCount = await this.postRepo.count({
        where: { authorId: candidate.id, archived: false },
      });

      suggestions.push({
        user: candidate,
        mutualFollowers: mutual,
        postsCount,
      });
    }

    // rank by mutual followers desc, then postsCount desc
    suggestions.sort(
      (a, b) =>
        b.mutualFollowers - a.mutualFollowers || b.postsCount - a.postsCount,
    );

    return suggestions.slice(0, limit);
  }
}
