import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PushService } from '@/modules/push/push.service';
import { PushSubscriptionEntity } from '@/modules/push/push-subscription.entity';
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
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';

/**
 * PushService unit tests.
 *
 * Mocks `web-push` so we don't actually send anything. The service
 * degrades gracefully when VAPID keys are absent (which is the case in
 * the test env), so most tests verify the storage + branching logic
 * without needing a configured VAPID context.
 */
jest.mock('web-push', () => {
  const actual = jest.requireActual('web-push');
  return {
    ...actual,
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
  };
});

// Pull the mocked module back so we can assert on it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpush = require('web-push');

describe('PushService', () => {
  let service: PushService;
  let subRepo: Repository<PushSubscriptionEntity>;
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

  const baseInput = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    p256dh: 'p256dh-key',
    auth: 'auth-secret',
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
        TypeOrmModule.forFeature([PushSubscriptionEntity, UserEntity]),
      ],
      providers: [PushService],
    }).compile();

    service = moduleRef.get(PushService);
    subRepo = moduleRef.get(getRepositoryToken(PushSubscriptionEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));

    // Force the service into "configured" mode by overriding isConfigured.
    // The real onModuleInit won't fire because we don't set VAPID env vars
    // in this test env. We patch it directly to test the sendPush path.
    (service as any).configured = true;
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // subscribe
  // -------------------------------------------------------------------------

  describe('subscribe', () => {
    it('creates a new subscription when endpoint is unknown', async () => {
      const user = await newUser('sub-create');
      const { subscription, created } = await service.subscribe(user.id, baseInput);
      expect(created).toBe(true);
      expect(subscription.endpoint).toBe(baseInput.endpoint);
      expect(subscription.p256dh).toBe(baseInput.p256dh);
      expect(subscription.auth).toBe(baseInput.auth);
      expect(subscription.userId).toBe(user.id);
    });

    it('updates keys when endpoint already exists for the user (idempotent)', async () => {
      const user = await newUser('sub-update');
      await service.subscribe(user.id, baseInput);
      const { subscription, created } = await service.subscribe(user.id, {
        ...baseInput,
        p256dh: 'new-p256dh',
        auth: 'new-auth',
      });
      expect(created).toBe(false);
      expect(subscription.p256dh).toBe('new-p256dh');
      expect(subscription.auth).toBe('new-auth');
    });

    it('allows different users to subscribe the same endpoint independently', async () => {
      const u1 = await newUser('sub-u1');
      const u2 = await newUser('sub-u2');
      const r1 = await service.subscribe(u1.id, baseInput);
      const r2 = await service.subscribe(u2.id, baseInput);
      expect(r1.created).toBe(true);
      expect(r2.created).toBe(true);
      expect(r1.subscription.id).not.toBe(r2.subscription.id);
    });

    it('stores expirationTime when provided', async () => {
      const user = await newUser('sub-exp');
      const { subscription } = await service.subscribe(user.id, {
        ...baseInput,
        expirationTime: 1234567890,
      });
      expect(subscription.expirationTime).toBe(1234567890);
    });

    it('stores null expirationTime when not provided', async () => {
      const user = await newUser('sub-noexp');
      const { subscription } = await service.subscribe(user.id, baseInput);
      expect(subscription.expirationTime).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribe
  // -------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('removes a single subscription by endpoint', async () => {
      const user = await newUser('unsub-1');
      await service.subscribe(user.id, baseInput);
      const removed = await service.unsubscribe(user.id, baseInput.endpoint);
      expect(removed).toBe(1);
      const after = await subRepo.find({ where: { userId: user.id } });
      expect(after).toHaveLength(0);
    });

    it('returns 0 when the endpoint does not match any subscription', async () => {
      const user = await newUser('unsub-2');
      const removed = await service.unsubscribe(user.id, 'nonexistent-endpoint');
      expect(removed).toBe(0);
    });

    it('does not remove subscriptions belonging to another user', async () => {
      const u1 = await newUser('unsub-a');
      const u2 = await newUser('unsub-b');
      await service.subscribe(u1.id, baseInput);
      const removed = await service.unsubscribe(u2.id, baseInput.endpoint);
      expect(removed).toBe(0);
      // u1's subscription is still there
      const remaining = await subRepo.find({ where: { userId: u1.id } });
      expect(remaining).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribeAll
  // -------------------------------------------------------------------------

  describe('unsubscribeAll', () => {
    it('removes all subscriptions for the user', async () => {
      const user = await newUser('unsuball');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'ep-1' });
      await service.subscribe(user.id, { ...baseInput, endpoint: 'ep-2' });
      await service.subscribe(user.id, { ...baseInput, endpoint: 'ep-3' });
      const removed = await service.unsubscribeAll(user.id);
      expect(removed).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // listForUser
  // -------------------------------------------------------------------------

  describe('listForUser', () => {
    it('returns subscriptions newest-first', async () => {
      const user = await newUser('list');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'old' });
      // Add a small delay so createdAt differs (better-sqlite3 second-precision)
      await new Promise((r) => setTimeout(r, 1100));
      await service.subscribe(user.id, { ...baseInput, endpoint: 'new' });
      const list = await service.listForUser(user.id);
      expect(list).toHaveLength(2);
      expect(list[0].endpoint).toBe('new');
      expect(list[1].endpoint).toBe('old');
    });

    it('returns an empty array for a user with no subscriptions', async () => {
      const user = await newUser('list-empty');
      const list = await service.listForUser(user.id);
      expect(list).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // sendPush
  // -------------------------------------------------------------------------

  describe('sendPush', () => {
    it('returns 0 when the user has no subscriptions', async () => {
      const user = await newUser('send-empty');
      const sent = await service.sendPush(user.id, {
        title: 'T',
        body: 'B',
      });
      expect(sent).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('sends a notification to every subscription of the user', async () => {
      const user = await newUser('send-multi');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'ep-1' });
      await service.subscribe(user.id, { ...baseInput, endpoint: 'ep-2' });
      const sent = await service.sendPush(user.id, {
        title: 'Hello',
        body: 'World',
        tag: 'test',
      });
      expect(sent).toBe(2);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('prunes subscriptions that return 410 (gone)', async () => {
      const user = await newUser('send-prune');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'gone-ep' });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({
        statusCode: 410,
        message: 'Gone',
      });
      const sent = await service.sendPush(user.id, { title: 'T', body: 'B' });
      expect(sent).toBe(0);
      const after = await subRepo.find({ where: { userId: user.id } });
      expect(after).toHaveLength(0);
    });

    it('prunes subscriptions that return 404 (not found)', async () => {
      const user = await newUser('send-prune-404');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'nf-ep' });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({
        statusCode: 404,
        message: 'Not Found',
      });
      await service.sendPush(user.id, { title: 'T', body: 'B' });
      const after = await subRepo.find({ where: { userId: user.id } });
      expect(after).toHaveLength(0);
    });

    it('does NOT prune on non-4xx errors (e.g. 429 rate limit)', async () => {
      const user = await newUser('send-429');
      await service.subscribe(user.id, { ...baseInput, endpoint: 'rl-ep' });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({
        statusCode: 429,
        message: 'Too Many Requests',
      });
      await service.sendPush(user.id, { title: 'T', body: 'B' });
      const after = await subRepo.find({ where: { userId: user.id } });
      expect(after).toHaveLength(1);
    });

    it('serializes the payload as a JSON string', async () => {
      const user = await newUser('send-payload');
      await service.subscribe(user.id, baseInput);
      await service.sendPush(user.id, {
        title: 'T',
        body: 'B',
        url: '/x',
        tag: 'tag',
        data: { foo: 'bar' },
      });
      const call = (webpush.sendNotification as jest.Mock).mock.calls[0];
      const payloadArg = call[1];
      expect(typeof payloadArg).toBe('string');
      const parsed = JSON.parse(payloadArg);
      expect(parsed.title).toBe('T');
      expect(parsed.body).toBe('B');
      expect(parsed.url).toBe('/x');
      expect(parsed.tag).toBe('tag');
      expect(parsed.data.foo).toBe('bar');
    });
  });

  // -------------------------------------------------------------------------
  // Configuration / degraded mode
  // -------------------------------------------------------------------------

  describe('degraded mode', () => {
    it('sendPush is a no-op when not configured', async () => {
      const user = await newUser('degraded');
      await service.subscribe(user.id, baseInput);
      (service as any).configured = false;
      try {
        const sent = await service.sendPush(user.id, { title: 'T' });
        expect(sent).toBe(0);
        expect(webpush.sendNotification).not.toHaveBeenCalled();
      } finally {
        (service as any).configured = true;
      }
    });

    it('isConfigured returns the current state', () => {
      expect(service.isConfigured()).toBe(true);
      (service as any).configured = false;
      expect(service.isConfigured()).toBe(false);
      (service as any).configured = true;
    });
  });
});
