import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { FollowsService } from '../follows/follows.service';

export interface FeedResult {
  items: PostEntity[];
  hasMore: boolean;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    private readonly follows: FollowsService,
  ) {}

  /**
   * Personalized feed: posts from users that the current user follows,
   * mixed with their own posts, sorted by recency.
   */
  async getFeed(userId: string, limit = 20, offset = 0): Promise<FeedResult> {
    const followingIds = await this.follows.getFollowingIds(userId);
    const authorIds = [userId, ...followingIds];

    if (authorIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const [items, total] = await this.postRepo.findAndCount({
      where: { authorId: In(authorIds), archived: false },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['author'],
    });

    return {
      items,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Explore feed: trending/recent posts from all users (excluding archived).
   * In a real system this would be powered by an algorithm, but for MVP we use recency.
   */
  async getExploreFeed(limit = 30, offset = 0): Promise<FeedResult> {
    const [items, total] = await this.postRepo.findAndCount({
      where: { archived: false },
      order: { likesCount: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['author'],
    });

    return {
      items,
      hasMore: offset + items.length < total,
    };
  }
}
