import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PresenceService } from '@/modules/realtime/presence.service';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { UserEntity } from '@/modules/users/user.entity';
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
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { PushSubscriptionEntity } from '@/modules/push/push-subscription.entity';

/**
 * PresenceService unit tests.
 *
 * Tests cover:
 *  - addSocket: first socket triggers "came online", subsequent don't
 *  - removeSocket: last socket triggers "went offline" (after grace)
 *  - reconnect within grace cancels offline
 *  - isOnline / getOnlineUserIds / getSocketIds / getLastSeenAt
 *  - getMutualFollowIds: only returns bidirectional follows
 *  - getOnlineStatus: batched lookup
 *
 * Note: PresenceService uses real timers in the GRACE_MS window. We mock
 * the timeout by using jest's fake timers for the offline transition test.
 */
describe('PresenceService', () => {
  let service: PresenceService;
  let followRepo: Repository<FollowEntity>;
  let userRepo: Repository<UserEntity>;
  let moduleRef: any;

  const newUser = async (username: string) => {
    const u = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
    });
    return userRepo.save(u);
  };

  const follow = async (followerId: string, followingId: string, accepted = true) => {
    return followRepo.save(
      followRepo.create({
        followerId,
        followingId,
        isAccepted: accepted,
      }),
    );
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
        TypeOrmModule.forFeature([FollowEntity, UserEntity]),
      ],
      providers: [PresenceService],
    }).compile();

    service = moduleRef.get(PresenceService);
    followRepo = moduleRef.get(getRepositoryToken(FollowEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  // -------------------------------------------------------------------------
  // addSocket / isOnline
  // -------------------------------------------------------------------------

  describe('addSocket', () => {
    it('returns true the first time a user adds a socket', () => {
      const result = service.addSocket('user-1', 'socket-a');
      expect(result).toBe(true);
      expect(service.isOnline('user-1')).toBe(true);
    });

    it('returns false when adding a second socket for an already-online user', () => {
      service.addSocket('user-2', 'socket-a');
      const result = service.addSocket('user-2', 'socket-b');
      expect(result).toBe(false);
      expect(service.isOnline('user-2')).toBe(true);
      expect(service.getSocketIds('user-2').sort()).toEqual(['socket-a', 'socket-b']);
    });

    it('cancels a pending offline transition when a new socket is added', () => {
      service.addSocket('user-3', 'socket-a');
      service.removeSocket('user-3', 'socket-a'); // schedules offline
      const result = service.addSocket('user-3', 'socket-b'); // cancels offline
      expect(result).toBe(true); // was empty → came online again
      expect(service.isOnline('user-3')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // removeSocket
  // -------------------------------------------------------------------------

  describe('removeSocket', () => {
    it('returns false when removing a socket from a user with multiple sockets', () => {
      service.addSocket('user-4', 'socket-a');
      service.addSocket('user-4', 'socket-b');
      const result = service.removeSocket('user-4', 'socket-a');
      expect(result).toBe(false);
      expect(service.isOnline('user-4')).toBe(true);
    });

    it('returns true when removing the last socket (schedules offline)', () => {
      service.addSocket('user-5', 'socket-a');
      const result = service.removeSocket('user-5', 'socket-a');
      expect(result).toBe(true);
      // Still "online" until the grace timer fires — but isOnline checks
      // socket count, which is now 0. So isOnline returns false immediately.
      expect(service.isOnline('user-5')).toBe(false);
    });

    it('returns false when removing a socket from an unknown user', () => {
      const result = service.removeSocket('never-seen', 'socket-x');
      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Grace period — using fake timers
  // -------------------------------------------------------------------------

  describe('grace period', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('clears the user entry after the grace period elapses', () => {
      service.addSocket('grace-1', 'socket-a');
      service.removeSocket('grace-1', 'socket-a');
      // Entry should still be present (just with no sockets) during grace
      expect(service.getLastSeenAt('grace-1')).toBeGreaterThan(0);
      // Fast-forward past the grace period (30s)
      jest.advanceTimersByTime(31_000);
      // After grace, the entry is gone — lastSeenAt returns 0
      expect(service.getLastSeenAt('grace-1')).toBe(0);
    });

    it('does not clear the entry if a new socket reconnects within grace', () => {
      service.addSocket('grace-2', 'socket-a');
      service.removeSocket('grace-2', 'socket-a');
      // Reconnect before grace expires
      jest.advanceTimersByTime(10_000);
      service.addSocket('grace-2', 'socket-b');
      // Fast-forward past grace — entry should still be present
      jest.advanceTimersByTime(31_000);
      expect(service.isOnline('grace-2')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getOnlineUserIds
  // -------------------------------------------------------------------------

  describe('getOnlineUserIds', () => {
    it('returns the list of currently-online user IDs', () => {
      service.addSocket('list-a', 's1');
      service.addSocket('list-b', 's2');
      service.addSocket('list-c', 's3');
      const ids = service.getOnlineUserIds().sort();
      expect(ids).toContain('list-a');
      expect(ids).toContain('list-b');
      expect(ids).toContain('list-c');
    });
  });

  // -------------------------------------------------------------------------
  // getMutualFollowIds
  // -------------------------------------------------------------------------

  describe('getMutualFollowIds', () => {
    let alice: UserEntity;
    let bob: UserEntity;
    let carol: UserEntity;
    let dave: UserEntity;

    beforeAll(async () => {
      alice = await newUser('alice');
      bob = await newUser('bob');
      carol = await newUser('carol');
      dave = await newUser('dave');

      // Alice <-> Bob: mutual
      await follow(alice.id, bob.id);
      await follow(bob.id, alice.id);

      // Alice -> Carol: one-way (Carol doesn't follow back)
      await follow(alice.id, carol.id);

      // Dave -> Alice + Alice -> Dave: mutual (set up just once)
      await follow(dave.id, alice.id);
      await follow(alice.id, dave.id);
    });

    it('returns only users who mutually follow each other', async () => {
      const mutual = await service.getMutualFollowIds(alice.id);
      // Should include Bob and Dave (mutual), but NOT Carol (Alice follows
      // Carol but Carol doesn't follow Alice back).
      expect(mutual).toContain(bob.id);
      expect(mutual).toContain(dave.id);
      expect(mutual).not.toContain(carol.id);
      expect(mutual).not.toContain(alice.id);
    });

    it('returns an empty array for a user with no follows', async () => {
      const loner = await newUser('loner');
      const mutual = await service.getMutualFollowIds(loner.id);
      expect(mutual).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getOnlineStatus (batched)
  // -------------------------------------------------------------------------

  describe('getOnlineStatus', () => {
    it('returns isOnline:false for an unknown user', () => {
      const status = service.getOnlineStatus(['unknown-user']);
      expect(status).toHaveLength(1);
      expect(status[0]).toEqual({
        userId: 'unknown-user',
        isOnline: false,
        lastSeenAt: 0,
      });
    });

    it('returns isOnline:true for a user with an active socket', () => {
      service.addSocket('status-1', 's1');
      const status = service.getOnlineStatus(['status-1', 'status-2']);
      expect(status).toHaveLength(2);
      const online = status.find((s) => s.userId === 'status-1');
      const offline = status.find((s) => s.userId === 'status-2');
      expect(online?.isOnline).toBe(true);
      expect(online?.lastSeenAt).toBeGreaterThan(0);
      expect(offline?.isOnline).toBe(false);
      expect(offline?.lastSeenAt).toBe(0);
    });
  });
});
