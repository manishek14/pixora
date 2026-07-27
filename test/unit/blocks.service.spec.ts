import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlocksService } from '@/modules/blocks/blocks.service';
import { BlockEntity } from '@/modules/blocks/block.entity';
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
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { NotificationEntity } from '@/modules/notifications/entities/notification.entity';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BlocksService', () => {
  let service: BlocksService;
  let blockRepo: Repository<BlockEntity>;
  let userRepo: Repository<UserEntity>;
  let moduleRef: any;

  const newUser = async (username: string) => {
    return userRepo.save(
      userRepo.create({
        username,
        email: `${username}@test.com`,
        password: 'hashed',
      }),
    );
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
        TypeOrmModule.forFeature([BlockEntity, UserEntity]),
      ],
      providers: [BlocksService],
    }).compile();

    service = moduleRef.get(BlocksService);
    blockRepo = moduleRef.get(getRepositoryToken(BlockEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await blockRepo.clear();
    await userRepo.clear();
  });

  describe('block', () => {
    it('creates a block', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const block = await service.block(alice.id, bob.id);
      expect(block.blockerId).toBe(alice.id);
      expect(block.blockedId).toBe(bob.id);
    });

    it('is idempotent — re-blocking returns the existing record', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const first = await service.block(alice.id, bob.id);
      const second = await service.block(alice.id, bob.id);
      expect(second.id).toBe(first.id);
      const all = await blockRepo.find();
      expect(all).toHaveLength(1);
    });

    it('rejects blocking self', async () => {
      const alice = await newUser('alice');
      await expect(service.block(alice.id, alice.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFound if target user does not exist', async () => {
      const alice = await newUser('alice');
      await expect(service.block(alice.id, '00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows asymmetric reverse: bob can also block alice', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.block(alice.id, bob.id);
      const reverse = await service.block(bob.id, alice.id);
      expect(reverse.blockerId).toBe(bob.id);
      expect(reverse.blockedId).toBe(alice.id);
      const all = await blockRepo.find();
      expect(all).toHaveLength(2);
    });
  });

  describe('unblock', () => {
    it('removes a block and returns true', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.block(alice.id, bob.id);
      const result = await service.unblock(alice.id, bob.id);
      expect(result).toBe(true);
      expect(await blockRepo.count()).toBe(0);
    });

    it('returns false if no block existed (idempotent)', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const result = await service.unblock(alice.id, bob.id);
      expect(result).toBe(false);
    });
  });

  describe('listBlockedBy', () => {
    it('lists users blocked by a given user, newest first', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const b1 = await service.block(alice.id, bob.id);
      // small delay to test ordering
      await new Promise((r) => setTimeout(r, 50));
      const b2 = await service.block(alice.id, carol.id);
      const list = await service.listBlockedBy(alice.id);
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe(b2.id);
      expect(list[1].id).toBe(b1.id);
    });

    it('returns empty array when user has blocked no one', async () => {
      const alice = await newUser('alice');
      const list = await service.listBlockedBy(alice.id);
      expect(list).toEqual([]);
    });
  });

  describe('isBlocking', () => {
    it('returns true when blocker has blocked target', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.block(alice.id, bob.id);
      expect(await service.isBlocking(alice.id, bob.id)).toBe(true);
    });

    it('returns false for the reverse direction (asymmetric)', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.block(alice.id, bob.id);
      expect(await service.isBlocking(bob.id, alice.id)).toBe(false);
    });
  });

  describe('isBlockedEitherWay', () => {
    it('returns true when either party has blocked the other', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.block(alice.id, bob.id);
      expect(await service.isBlockedEitherWay(alice.id, bob.id)).toBe(true);
      expect(await service.isBlockedEitherWay(bob.id, alice.id)).toBe(true);
    });

    it('returns false when neither has blocked', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      expect(await service.isBlockedEitherWay(alice.id, bob.id)).toBe(false);
    });

    it('returns false when comparing a user to themselves', async () => {
      const alice = await newUser('alice');
      expect(await service.isBlockedEitherWay(alice.id, alice.id)).toBe(false);
    });
  });

  describe('getBlockedIds / getBlockerIds', () => {
    it('getBlockedIds returns users the current user has blocked', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      await service.block(alice.id, bob.id);
      await service.block(alice.id, carol.id);
      const ids = await service.getBlockedIds(alice.id);
      expect(ids.sort()).toEqual([bob.id, carol.id].sort());
    });

    it('getBlockerIds returns users who have blocked the current user', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      await service.block(bob.id, alice.id);
      await service.block(carol.id, alice.id);
      const ids = await service.getBlockerIds(alice.id);
      expect(ids.sort()).toEqual([bob.id, carol.id].sort());
    });

    it('returns empty arrays when no blocks exist', async () => {
      const alice = await newUser('alice');
      expect(await service.getBlockedIds(alice.id)).toEqual([]);
      expect(await service.getBlockerIds(alice.id)).toEqual([]);
    });
  });
});
