import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MutesService } from '@/modules/mutes/mutes.service';
import { MuteEntity } from '@/modules/mutes/mute.entity';
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
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { NotificationEntity } from '@/modules/notifications/entities/notification.entity';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MutesService', () => {
  let service: MutesService;
  let muteRepo: Repository<MuteEntity>;
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
        TypeOrmModule.forFeature([MuteEntity, UserEntity]),
      ],
      providers: [MutesService],
    }).compile();

    service = moduleRef.get(MutesService);
    muteRepo = moduleRef.get(getRepositoryToken(MuteEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await muteRepo.clear();
    await userRepo.clear();
  });

  describe('mute', () => {
    it('creates a mute with both flags defaulting to true', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const mute = await service.mute(alice.id, bob.id);
      expect(mute.muterId).toBe(alice.id);
      expect(mute.mutedId).toBe(bob.id);
      expect(mute.mutePosts).toBe(true);
      expect(mute.muteStories).toBe(true);
    });

    it('creates a posts-only mute', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const mute = await service.mute(alice.id, bob.id, true, false);
      expect(mute.mutePosts).toBe(true);
      expect(mute.muteStories).toBe(false);
    });

    it('creates a stories-only mute', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const mute = await service.mute(alice.id, bob.id, false, true);
      expect(mute.mutePosts).toBe(false);
      expect(mute.muteStories).toBe(true);
    });

    it('updates flags in place if a mute already exists', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.mute(alice.id, bob.id, true, true);
      const updated = await service.mute(alice.id, bob.id, false, true);
      expect(updated.mutePosts).toBe(false);
      expect(updated.muteStories).toBe(true);
      expect(await muteRepo.count()).toBe(1);
    });

    it('rejects muting self', async () => {
      const alice = await newUser('alice');
      await expect(service.mute(alice.id, alice.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFound if target user does not exist', async () => {
      const alice = await newUser('alice');
      await expect(
        service.mute(alice.id, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unmute', () => {
    it('removes a mute and returns true', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.mute(alice.id, bob.id);
      const result = await service.unmute(alice.id, bob.id);
      expect(result).toBe(true);
      expect(await muteRepo.count()).toBe(0);
    });

    it('returns false if no mute existed (idempotent)', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const result = await service.unmute(alice.id, bob.id);
      expect(result).toBe(false);
    });
  });

  describe('listMutedBy', () => {
    it('lists users muted by a given user, newest first', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const m1 = await service.mute(alice.id, bob.id);
      await new Promise((r) => setTimeout(r, 50));
      const m2 = await service.mute(alice.id, carol.id);
      const list = await service.listMutedBy(alice.id);
      expect(list).toHaveLength(2);
      // Newest first — carol was muted later
      expect(list[0].id).toBe(m2.id);
      expect(list[1].id).toBe(m1.id);
    });

    it('returns empty array when user has muted no one', async () => {
      const alice = await newUser('alice');
      expect(await service.listMutedBy(alice.id)).toEqual([]);
    });
  });

  describe('getMute / isMutedPosts / isMutedStories', () => {
    it('getMute returns the row if it exists, null otherwise', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      expect(await service.getMute(alice.id, bob.id)).toBeNull();
      await service.mute(alice.id, bob.id, true, false);
      const mute = await service.getMute(alice.id, bob.id);
      expect(mute).not.toBeNull();
      expect(mute!.mutePosts).toBe(true);
      expect(mute!.muteStories).toBe(false);
    });

    it('isMutedPosts / isMutedStories return correct values', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.mute(alice.id, bob.id, true, false);
      expect(await service.isMutedPosts(alice.id, bob.id)).toBe(true);
      expect(await service.isMutedStories(alice.id, bob.id)).toBe(false);
    });

    it('returns false for both when no mute exists', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      expect(await service.isMutedPosts(alice.id, bob.id)).toBe(false);
      expect(await service.isMutedStories(alice.id, bob.id)).toBe(false);
    });
  });

  describe('getMutedPostsIds / getMutedStoriesIds', () => {
    it('returns muted-for-posts user ids', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      // bob: muted for posts only, carol: muted for both
      await service.mute(alice.id, bob.id, true, false);
      await service.mute(alice.id, carol.id, true, true);
      const postIds = await service.getMutedPostsIds(alice.id);
      expect(postIds.sort()).toEqual([bob.id, carol.id].sort());
    });

    it('returns muted-for-stories user ids (excludes posts-only mutes)', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      await service.mute(alice.id, bob.id, true, false); // posts only
      await service.mute(alice.id, carol.id, true, true); // both
      const storyIds = await service.getMutedStoriesIds(alice.id);
      expect(storyIds).toEqual([carol.id]);
    });

    it('returns empty arrays when no mutes exist', async () => {
      const alice = await newUser('alice');
      expect(await service.getMutedPostsIds(alice.id)).toEqual([]);
      expect(await service.getMutedStoriesIds(alice.id)).toEqual([]);
    });
  });
});
