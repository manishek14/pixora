import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { PostEntity } from './post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  async create(authorId: string, input: CreatePostInput): Promise<PostEntity> {
    // Extract hashtags from caption if not provided
    let hashtags = input.hashtags || [];
    if (input.caption && hashtags.length === 0) {
      const matches = input.caption.match(/#[\w\u0600-\u06FF]+/g);
      if (matches) hashtags = matches.map((h) => h.slice(1).toLowerCase());
    }

    // Extract mentions from caption
    let mentions = input.mentions || [];
    if (input.caption && mentions.length === 0) {
      const matches = input.caption.match(/@[\w_.]+/g);
      if (matches) mentions = matches.map((m) => m.slice(1).toLowerCase());
    }

    const post = this.postRepo.create({
      ...input,
      hashtags,
      mentions,
      authorId,
      mediaUrls: input.mediaUrls,
    });

    const saved = await this.postRepo.save(post);
    // Reload with author relation populated
    return this.postRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    }) as Promise<PostEntity>;
  }

  async findById(id: string): Promise<PostEntity> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException('post not found');
    return post;
  }

  async findByAuthor(authorId: string, limit = 20, offset = 0): Promise<PostEntity[]> {
    return this.postRepo.find({
      where: { authorId, archived: false },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async update(postId: string, authorId: string, input: UpdatePostInput): Promise<PostEntity> {
    const post = await this.findById(postId);
    if (post.authorId !== authorId) {
      throw new ForbiddenException('not allowed to edit this post');
    }
    Object.assign(post, input);
    return this.postRepo.save(post);
  }

  async delete(postId: string, authorId: string): Promise<boolean> {
    const post = await this.findById(postId);
    if (post.authorId !== authorId) {
      throw new ForbiddenException('not allowed to delete this post');
    }
    await this.postRepo.remove(post);
    return true;
  }

  async archive(postId: string, authorId: string, archive: boolean): Promise<PostEntity> {
    const post = await this.findById(postId);
    if (post.authorId !== authorId) {
      throw new ForbiddenException('not allowed');
    }
    post.archived = archive;
    return this.postRepo.save(post);
  }

  async findByHashtag(tag: string, limit = 20, offset = 0): Promise<PostEntity[]> {
    const normalized = tag.toLowerCase().replace(/^#/, '');
    // hashtags are stored as a comma-separated string; use LIKE which works on both
    // PostgreSQL and SQLite. We match hashtag as a whole element of the array.
    // The simple-array column stores values as "tag1,tag2,tag3".
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
      .andWhere('p.archived = :archived', { archived: false })
      .orderBy('p.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async incrementLikes(postId: string, by = 1): Promise<void> {
    await this.postRepo.increment({ id: postId }, 'likesCount', by);
  }

  async decrementLikes(postId: string, by = 1): Promise<void> {
    await this.postRepo.decrement({ id: postId }, 'likesCount', by);
  }

  async incrementComments(postId: string, by = 1): Promise<void> {
    await this.postRepo.increment({ id: postId }, 'commentsCount', by);
  }

  async decrementComments(postId: string, by = 1): Promise<void> {
    await this.postRepo.decrement({ id: postId }, 'commentsCount', by);
  }
}
