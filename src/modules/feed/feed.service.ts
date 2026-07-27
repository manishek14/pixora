import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { FollowsService } from '../follows/follows.service';
import { MutesService } from '../mutes/mutes.service';
import { BlocksService } from '../blocks/blocks.service';

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
    private readonly mutes: MutesService,
    private readonly blocks: BlocksService,
  ) {}

  /**
   * Personalized feed: posts from users that the current user follows,
   * mixed with their own posts, sorted by recency.
   *
   * Filters out:
   *  - posts from muted users (mutePosts=true)
   *  - posts from users the viewer has blocked (or who have blocked them)
   */
  async getFeed(userId: string, limit = 20, offset = 0): Promise<FeedResult> {
    const followingIds = await this.follows.getFollowingIds(userId);
    let authorIds = [userId, ...followingIds];

    if (authorIds.length === 0) {
      return { items: [], hasMore: false };
    }

    // Remove muted-from-posts user IDs from the feed author list.
    if (followingIds.length > 0) {
      const mutedPostIds = new Set(await this.mutes.getMutedPostsIds(userId));
      authorIds = authorIds.filter((id) => !mutedPostIds.has(id));
    }

    // Remove blocked users either way.
    if (followingIds.length > 0) {
      const blockedIds = new Set(await this.blocks.getBlockedIds(userId));
      const blockerIds = new Set(await this.blocks.getBlockerIds(userId));
      authorIds = authorIds.filter(
        (id) => !blockedIds.has(id) && !blockerIds.has(id),
      );
    }

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
   * Excludes posts by users the viewer has muted/blocked (or who have blocked the viewer).
   * In a real system this would be powered by an algorithm, but for MVP we use recency.
   */
  async getExploreFeed(userId: string | null, limit = 30, offset = 0): Promise<FeedResult> {
    let excludeAuthorIds: string[] = [];
    if (userId) {
      const muted = await this.mutes.getMutedPostsIds(userId);
      const blocked = await this.blocks.getBlockedIds(userId);
      const blockers = await this.blocks.getBlockerIds(userId);
      excludeAuthorIds = [...new Set([...muted, ...blocked, ...blockers])];
    }

    const where: any = { archived: false };
    if (excludeAuthorIds.length > 0) {
      where.authorId = Not(In(excludeAuthorIds));
    }

    const [items, total] = await this.postRepo.findAndCount({
      where,
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
