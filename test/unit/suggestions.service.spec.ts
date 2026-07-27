import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuggestionsService } from '@/modules/suggestions/suggestions.service';
import { BlocksService } from '@/modules/blocks/blocks.service';
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { UserEntity } from '@/modules/users/user.entity';
import { PostEntity } from '@/modules/posts/post.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity } from '@/modules/highlights/entities/highlight-item.entity';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { NotificationEntity } from '@/modules/notifications/entities/notification.entity';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { FollowsService } from '@/modules/follows/follows.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let followsService: FollowsService;
  let blocksService: BlocksService;
  let userRepo: Repository<UserEntity>;
  let followRepo: Repository<FollowEntity>;
  let moduleRef: any;

  const newUser = async (username: string, verified = false) => {
    const user = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
      isVerified: verified,
    });
    return userRepo.save(user);
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [
            UserEntity,
            PostEntity,
            FollowEntity,
            LikeEntity,
            CommentEntity,
            StoryEntity,
            StoryViewEntity,
            StoryReactionEntity,
            HighlightEntity,
            HighlightItemEntity,
            ReelViewEntity,
            BookmarkEntity,
            BlockEntity,
            MuteEntity,
            CollectionEntity,
            CollectionItemEntity,
            NotificationEntity,
            MessageThreadEntity,
            MessageEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([UserEntity, FollowEntity, BlockEntity, NotificationEntity]),
      ],
      providers: [
        SuggestionsService,
        FollowsService,
        BlocksService,
        NotificationsService,
      ],
    }).compile();

    service = moduleRef.get(SuggestionsService);
    followsService = moduleRef.get(FollowsService);
    blocksService = moduleRef.get(BlocksService);
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    followRepo = moduleRef.get(getRepositoryToken(FollowEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await followRepo.clear();
    await userRepo.clear();
  });

  describe('suggest', () => {
    it('returns suggestions based on mutual friends', async () => {
      // Setup: alice follows dave. dave follows bob and carol.
      // Alice should be suggested bob and carol (mutual = 1 each via dave).
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const dave = await newUser('dave');

      await followsService.follow(alice.id, dave.id); // alice → dave
      await followsService.follow(dave.id, bob.id); // dave → bob
      await followsService.follow(dave.id, carol.id); // dave → carol

      const result = await service.suggest(alice.id, 10);
      expect(result.total).toBe(2);
      const suggestedIds = new Set(result.items.map((s) => s.user.id));
      expect(suggestedIds.has(bob.id)).toBe(true);
      expect(suggestedIds.has(carol.id)).toBe(true);
      // Mutual count should be 1 each (just dave is mutual)
      for (const item of result.items) {
        expect(item.mutualCount).toBe(1);
        expect(item.reason).toContain('1');
      }
    });

    it('ranks suggestions by mutual count desc', async () => {
      // alice follows dave and eve. dave follows bob. eve follows bob AND carol.
      // So bob has mutual=2, carol has mutual=1. Bob should rank higher.
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const dave = await newUser('dave');
      const eve = await newUser('eve');

      await followsService.follow(alice.id, dave.id);
      await followsService.follow(alice.id, eve.id);
      await followsService.follow(dave.id, bob.id);
      await followsService.follow(eve.id, bob.id);
      await followsService.follow(eve.id, carol.id);

      const result = await service.suggest(alice.id, 10);
      expect(result.items[0].user.id).toBe(bob.id);
      expect(result.items[0].mutualCount).toBe(2);
      expect(result.items[1].user.id).toBe(carol.id);
      expect(result.items[1].mutualCount).toBe(1);
    });

    it('excludes users already followed', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const dave = await newUser('dave');
      // alice follows dave and bob (both should be excluded from suggestions)
      await followsService.follow(alice.id, dave.id);
      await followsService.follow(alice.id, bob.id);
      // dave follows bob and carol — carol should be suggested, bob should NOT
      await followsService.follow(dave.id, bob.id);
      await followsService.follow(dave.id, carol.id);

      const result = await service.suggest(alice.id, 10);
      const suggestedIds = result.items.map((s) => s.user.username);
      expect(suggestedIds).not.toContain('bob');
      expect(suggestedIds).not.toContain('dave');
      expect(suggestedIds).toContain('carol');
    });

    it('excludes self', async () => {
      const alice = await newUser('alice');
      const result = await service.suggest(alice.id, 10);
      expect(result.items.find((s) => s.user.id === alice.id)).toBeUndefined();
    });

    it('excludes blocked users (either direction)', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const dave = await newUser('dave');

      await followsService.follow(alice.id, dave.id);
      await followsService.follow(dave.id, bob.id);
      await followsService.follow(dave.id, carol.id);

      // alice blocks bob — should be excluded
      await blocksService.block(alice.id, bob.id);
      // carol blocks alice — should also be excluded
      await blocksService.block(carol.id, alice.id);

      const result = await service.suggest(alice.id, 10);
      const suggestedIds = result.items.map((s) => s.user.id);
      expect(suggestedIds).not.toContain(bob.id);
      expect(suggestedIds).not.toContain(carol.id);
    });

    it('returns verified users as fallback when no mutual friends exist', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob', true); // verified
      const carol = await newUser('carol', true); // verified

      const result = await service.suggest(alice.id, 10);
      expect(result.total).toBe(2);
      const reasons = result.items.map((s) => s.reason);
      expect(reasons.every((r) => r.includes('تأیید'))).toBe(true);
    });

    it('returns empty when user has no followings, no blocks, and no verified users', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob'); // not verified
      const result = await service.suggest(alice.id, 10);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('respects the limit parameter', async () => {
      const alice = await newUser('alice');
      for (let i = 0; i < 5; i++) {
        await newUser(`user${i}`, true);
      }
      const result = await service.suggest(alice.id, 2);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });
  });
});
