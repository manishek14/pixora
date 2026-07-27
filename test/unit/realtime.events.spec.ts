import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeEvents } from '@/modules/realtime/realtime.events';
import { PresenceService } from '@/modules/realtime/presence.service';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { UserEntity } from '@/modules/users/user.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { PostEntity } from '@/modules/posts/post.entity';
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
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { PushSubscriptionEntity } from '@/modules/push/push-subscription.entity';

/**
 * RealtimeEvents unit tests.
 *
 * Verifies the routing logic:
 *  - emitToUser routes via server.to(`user:<id>`).emit(...)
 *  - emitToThreadParticipants looks up the thread, then emits to each
 *    participant except the excluded one
 *  - emitToFriends uses PresenceService.getMutualFollowIds
 *  - all emits are no-ops when no server is attached
 */
describe('RealtimeEvents', () => {
  let events: RealtimeEvents;
  let presence: PresenceService;
  let threadRepo: Repository<MessageThreadEntity>;
  let userRepo: Repository<UserEntity>;
  let followRepo: Repository<FollowEntity>;
  let moduleRef: any;

  // Mock socket server — captures emit() calls into a list we can assert on.
  let mockServer: {
    to: jest.Mock;
    emit: jest.Mock;
    roomEmit: jest.Mock;
  };

  const newUser = async (username: string) => {
    const u = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
    });
    return userRepo.save(u);
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
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
            NotificationEntity,
            MessageThreadEntity,
            MessageEntity,
            BlockEntity,
            MuteEntity,
            CollectionEntity,
            CollectionItemEntity,
            PushSubscriptionEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([MessageThreadEntity, FollowEntity, UserEntity]),
      ],
      providers: [RealtimeEvents, PresenceService],
    }).compile();

    events = moduleRef.get(RealtimeEvents);
    presence = moduleRef.get(PresenceService);
    threadRepo = moduleRef.get(getRepositoryToken(MessageThreadEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    followRepo = moduleRef.get(getRepositoryToken(FollowEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(() => {
    mockServer = {
      to: jest.fn(),
      emit: jest.fn(),
      roomEmit: jest.fn(),
    };
    // server.to(room) returns an object with .emit(event, payload)
    mockServer.to.mockReturnValue({ emit: mockServer.roomEmit });
    events.attachServer(mockServer as any);
  });

  // -------------------------------------------------------------------------
  // emitToUser
  // -------------------------------------------------------------------------

  describe('emitToUser', () => {
    it('routes the event to the user:<userId> room', () => {
      events.emitToUser('user-1', 'test_event', { hello: 'world' });
      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.roomEmit).toHaveBeenCalledWith('test_event', {
        hello: 'world',
      });
    });

    it('is a no-op when no server is attached', () => {
      (events as any).server = null;
      expect(() =>
        events.emitToUser('user-1', 'test_event', { hello: 'world' }),
      ).not.toThrow();
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('passes through any payload type', () => {
      const payload = { a: 1, b: ['x', 'y'], nested: { c: true } };
      events.emitToUser('user-1', 'complex', payload);
      expect(mockServer.roomEmit).toHaveBeenCalledWith('complex', payload);
    });
  });

  // -------------------------------------------------------------------------
  // emitToThreadParticipants
  // -------------------------------------------------------------------------

  describe('emitToThreadParticipants', () => {
    let alice: UserEntity;
    let bob: UserEntity;
    let thread: MessageThreadEntity;

    beforeAll(async () => {
      alice = await newUser('rt-alice');
      bob = await newUser('rt-bob');
      // Create a thread with deterministic userA/userB ordering
      const [userAId, userBId] = alice.id < bob.id ? [alice.id, bob.id] : [bob.id, alice.id];
      thread = threadRepo.create({ userAId, userBId });
      thread = await threadRepo.save(thread);
    });

    it('emits to both participants when no exclude is given', async () => {
      await events.emitToThreadParticipants(thread.id, 'event', {});
      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${thread.userAId}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${thread.userBId}`);
    });

    it('skips the excluded participant', async () => {
      mockServer.to.mockClear();
      mockServer.roomEmit.mockClear();
      await events.emitToThreadParticipants(
        thread.id,
        'event',
        {},
        thread.userAId, // exclude A
      );
      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${thread.userBId}`);
      expect(mockServer.to).not.toHaveBeenCalledWith(`user:${thread.userAId}`);
    });

    it('is a no-op for an unknown thread id', async () => {
      mockServer.to.mockClear();
      await events.emitToThreadParticipants('unknown-thread', 'event', {});
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // emitToFriends
  // -------------------------------------------------------------------------

  describe('emitToFriends', () => {
    let alice: UserEntity;
    let bob: UserEntity;
    let carol: UserEntity;

    beforeAll(async () => {
      alice = await newUser('ef-alice');
      bob = await newUser('ef-bob');
      carol = await newUser('ef-carol');

      // Mutual: alice <-> bob
      await followRepo.save(followRepo.create({ followerId: alice.id, followingId: bob.id, isAccepted: true }));
      await followRepo.save(followRepo.create({ followerId: bob.id, followingId: alice.id, isAccepted: true }));

      // Mutual: alice <-> carol
      await followRepo.save(followRepo.create({ followerId: alice.id, followingId: carol.id, isAccepted: true }));
      await followRepo.save(followRepo.create({ followerId: carol.id, followingId: alice.id, isAccepted: true }));
    });

    it('emits to every mutual follow of the user', async () => {
      mockServer.to.mockClear();
      await events.emitToFriends(alice.id, 'presence_update', {
        userId: alice.id,
        isOnline: true,
      });
      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${bob.id}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${carol.id}`);
    });

    it('emits to nobody when the user has no mutuals', async () => {
      const loner = await newUser('ef-loner');
      mockServer.to.mockClear();
      await events.emitToFriends(loner.id, 'presence_update', {
        userId: loner.id,
        isOnline: true,
      });
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // isAttached / attachServer
  // -------------------------------------------------------------------------

  describe('server lifecycle', () => {
    it('isAttached returns true after attachServer', () => {
      expect(events.isAttached()).toBe(true);
    });

    it('isAttached returns false before attachServer', () => {
      const fresh = new RealtimeEvents(
        threadRepo as any,
        presence,
      );
      expect(fresh.isAttached()).toBe(false);
    });
  });
});
