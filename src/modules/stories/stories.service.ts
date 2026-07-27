import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StoryEntity, StoryVisibility } from './entities/story.entity';
import { StoryViewEntity } from './entities/story-view.entity';
import { StoryReactionEntity } from './entities/story-reaction.entity';
import { UserEntity } from '../users/user.entity';
import { FollowsService } from '../follows/follows.service';
import { CreateStoryInput } from './dto/create-story.input';
import { UserStoriesGroup } from './types/user-stories-group';

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_GRACE_MS = 24 * 60 * 60 * 1000; // keep expired stories for 24h after expiry before hard-deleting

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectRepository(StoryEntity)
    private readonly storyRepo: Repository<StoryEntity>,
    @InjectRepository(StoryViewEntity)
    private readonly viewRepo: Repository<StoryViewEntity>,
    @InjectRepository(StoryReactionEntity)
    private readonly reactionRepo: Repository<StoryReactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly follows: FollowsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async create(authorId: string, input: CreateStoryInput): Promise<StoryEntity> {
    const expiresAt = new Date(Date.now() + STORY_TTL_MS);
    const story = this.storyRepo.create({
      authorId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption,
      visibility: input.visibility ?? StoryVisibility.Public,
      expiresAt,
    });
    await this.storyRepo.save(story);
    // Reload with author + computed fields (save() does not populate eager relations)
    const saved = await this.storyRepo.findOne({
      where: { id: story.id },
      relations: ['author', 'views', 'views.user', 'reactions'],
    });
    if (!saved) throw new Error('failed to reload story after create');
    return this.withComputed(saved, authorId);
  }

  async delete(authorId: string, storyId: string): Promise<boolean> {
    const story = await this.storyRepo.findOne({
      where: { id: storyId },
    });
    if (!story) throw new NotFoundException('story not found');
    if (story.authorId !== authorId) {
      throw new ForbiddenException('cannot delete another user\u2019s story');
    }
    await this.storyRepo.remove(story);
    return true;
  }

  /**
   * Mark a story as viewed by the current user. Idempotent — re-viewing the
   * same story just no-ops (the unique constraint on (storyId, userId) is
   * enforced by the StoryViewEntity schema).
   */
  async view(viewerId: string, storyId: string): Promise<StoryEntity> {
    // Verify visibility first
    await this.findVisibleOrThrow(viewerId, storyId);

    // Insert view if not already present
    const existing = await this.viewRepo.findOne({
      where: { storyId, userId: viewerId },
    });
    if (!existing) {
      try {
        await this.viewRepo.save({ storyId, userId: viewerId });
      } catch (err) {
        // Race condition — two concurrent inserts: ignore
        this.logger.debug(`view race: ${err}`);
      }
    }
    // Reload story with fresh views relation so viewsCount is accurate
    const fresh = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: ['author', 'views', 'views.user', 'reactions'],
    });
    if (!fresh) throw new NotFoundException('story not found');
    return this.withComputed(fresh, viewerId);
  }

  /**
   * Set or update the viewer's emoji reaction to a story. One reaction per
   * user per story — calling again with a different emoji replaces it.
   */
  async react(
    viewerId: string,
    storyId: string,
    emoji: string,
  ): Promise<StoryEntity> {
    if (!emoji || emoji.length > 10) {
      throw new ForbiddenException('emoji must be 1-10 characters');
    }
    await this.findVisibleOrThrow(viewerId, storyId);

    // Auto-view the story when reacting (matches Instagram UX)
    const existingView = await this.viewRepo.findOne({
      where: { storyId, userId: viewerId },
    });
    if (!existingView) {
      try {
        await this.viewRepo.save({ storyId, userId: viewerId });
      } catch (err) {
        this.logger.debug(`react-view race: ${err}`);
      }
    }

    const existingReaction = await this.reactionRepo.findOne({
      where: { storyId, userId: viewerId },
    });
    if (existingReaction) {
      existingReaction.emoji = emoji;
      await this.reactionRepo.save(existingReaction);
    } else {
      await this.reactionRepo.save({ storyId, userId: viewerId, emoji });
    }
    // Reload story with fresh relations so viewsCount + isViewedByMe are accurate
    const fresh = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: ['author', 'views', 'views.user', 'reactions'],
    });
    if (!fresh) throw new NotFoundException('story not found');
    return this.withComputed(fresh, viewerId);
  }

  async removeReaction(viewerId: string, storyId: string): Promise<boolean> {
    await this.reactionRepo.delete({ storyId, userId: viewerId });
    return true;
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Stories feed: active stories from me + users I follow, grouped by author.
   * Close-friends stories are filtered out unless I'm on the author's
   * close-friends list.
   */
  async getFeed(viewerId: string): Promise<UserStoriesGroup[]> {
    const followingIds = await this.follows.getFollowingIds(viewerId);
    const authorIds = [viewerId, ...followingIds];

    if (authorIds.length === 0) {
      return [];
    }

    const stories = await this.storyRepo.find({
      where: { authorId: In(authorIds), expiresAt: MoreThan(new Date()) },
      relations: ['author', 'views', 'views.user', 'reactions'],
      order: { createdAt: 'DESC' },
    });

    // Filter close_friends stories: visible only if I'm on author's CF list
    const filtered: StoryEntity[] = [];
    const cfCache = new Map<string, boolean>();
    for (const s of stories) {
      if (s.visibility === 'public' || s.authorId === viewerId) {
        filtered.push(s);
        continue;
      }
      // close_friends + not my own — check CF list
      let allowed = cfCache.get(s.authorId);
      if (allowed === undefined) {
        allowed = await this.follows.isOnCloseFriendsList(s.authorId, viewerId);
        cfCache.set(s.authorId, allowed);
      }
      if (allowed) filtered.push(s);
    }

    // Group by author
    const grouped = new Map<string, StoryEntity[]>();
    for (const s of filtered) {
      const list = grouped.get(s.authorId) ?? [];
      list.push(s);
      grouped.set(s.authorId, list);
    }

    // Build group DTOs with hasUnviewed indicator
    const result: UserStoriesGroup[] = [];
    for (const [authorId, authorStories] of grouped) {
      const user = authorStories[0].author;
      const hasUnviewed = authorStories.some(
        (s) => !s.views?.some((v) => v.userId === viewerId),
      );
      result.push({
        userId: authorId,
        user,
        stories: authorStories.map((s) => this.withComputed(s, viewerId)),
        storiesCount: authorStories.length,
        hasUnviewed,
      });
    }

    // Sort: viewer first, then by most recent story createdAt desc
    result.sort((a, b) => {
      if (a.userId === viewerId) return -1;
      if (b.userId === viewerId) return 1;
      const aTime = a.stories[0]?.createdAt.getTime() ?? 0;
      const bTime = b.stories[0]?.createdAt.getTime() ?? 0;
      return bTime - aTime;
    });

    return result;
  }

  /**
   * All active stories from a single user (visible to the current viewer).
   * Used when the client taps a user's avatar in the feed.
   */
  async getActiveByUser(viewerId: string, userId: string): Promise<StoryEntity[]> {
    const stories = await this.storyRepo.find({
      where: { authorId: userId, expiresAt: MoreThan(new Date()) },
      relations: ['author', 'views', 'views.user', 'reactions'],
      order: { createdAt: 'DESC' },
    });

    const result: StoryEntity[] = [];
    for (const s of stories) {
      if (s.visibility === 'public' || s.authorId === viewerId) {
        result.push(this.withComputed(s, viewerId));
        continue;
      }
      // close_friends
      const allowed = await this.follows.isOnCloseFriendsList(s.authorId, viewerId);
      if (allowed) result.push(this.withComputed(s, viewerId));
    }
    return result;
  }

  async getById(viewerId: string, storyId: string): Promise<StoryEntity> {
    const story = await this.findVisibleOrThrow(viewerId, storyId);
    return this.withComputed(story, viewerId);
  }

  /**
   * Returns the list of viewers for one of MY stories (author only).
   */
  async getViewers(authorId: string, storyId: string): Promise<StoryViewEntity[]> {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('story not found');
    if (story.authorId !== authorId) {
      throw new ForbiddenException('only the story author can see viewers');
    }
    return this.viewRepo.find({
      where: { storyId },
      relations: ['user'],
      order: { viewedAt: 'DESC' },
    });
  }

  // ---------------------------------------------------------------------------
  // Cron — hourly cleanup of long-expired stories
  // ---------------------------------------------------------------------------

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStories(): Promise<void> {
    const cutoff = new Date(Date.now() - CLEANUP_GRACE_MS);
    const result = await this.storyRepo.delete({ expiresAt: LessThan(cutoff) });
    if (result.affected && result.affected > 0) {
      this.logger.log(`cleanup: deleted ${result.affected} expired stories`);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Find a story by id, verify it hasn't expired, and verify the viewer is
   * allowed to see it (visibility check).
   */
  private async findVisibleOrThrow(
    viewerId: string,
    storyId: string,
  ): Promise<StoryEntity> {
    const story = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: ['author', 'views', 'views.user', 'reactions'],
    });
    if (!story) throw new NotFoundException('story not found');
    if (story.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('story has expired');
    }

    if (story.authorId !== viewerId && story.visibility === 'close_friends') {
      const allowed = await this.follows.isOnCloseFriendsList(
        story.authorId,
        viewerId,
      );
      if (!allowed) {
        // Use NotFound (not Forbidden) to avoid leaking the story's existence
        throw new NotFoundException('story not found');
      }
    }
    return story;
  }

  /**
   * Populate computed (non-persisted) fields on a story for the given viewer.
   */
  private withComputed(story: StoryEntity, viewerId: string): StoryEntity {
    story.viewsCount = story.views?.length ?? 0;
    story.isViewedByMe = !!story.views?.some((v) => v.userId === viewerId);
    story.isExpired = story.expiresAt.getTime() < Date.now();
    return story;
  }
}
