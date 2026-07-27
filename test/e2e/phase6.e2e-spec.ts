import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '@/app.module';
import { RealtimeEvents } from '@/modules/realtime/realtime.events';
import { PushService } from '@/modules/push/push.service';

/**
 * End-to-end tests for Phase 6 features:
 *  - Realtime: Socket.io connection auth, message_received / message_read /
 *    message_deleted / notification_received event delivery, typing indicator,
 *    presence broadcasts to mutual follows.
 *  - Push: subscribeToPush / unsubscribeFromPush / myPushSubscriptions
 *    GraphQL mutations, idempotency on re-subscribe, multi-user isolation,
 *    Web Push delivery (mocked — we don't actually hit FCM/Mozilla).
 *
 * Boots the full AppModule against an in-memory SQLite DB and exercises
 * both the HTTP/GraphQL surface (via supertest) and the Socket.io surface
 * (via socket.io-client).
 */

// Mock web-push so sendPush returns a synthetic 201 instead of hitting FCM.
jest.mock('web-push', () => {
  const actual = jest.requireActual('web-push');
  return {
    ...actual,
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
  };
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpush = require('web-push');

describe('Phase 6 E2E — Realtime + Push', () => {
  let app: INestApplication;
  let httpServer: any;
  let realtime: RealtimeEvents;
  let push: PushService;

  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let carolToken: string;
  let carolId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    await app.listen(0); // ephemeral port
    httpServer = app.getHttpServer();

    realtime = app.get(RealtimeEvents);
    push = app.get(PushService);
    // Force the push service into "configured" mode so sendPush actually fires.
    (push as any).configured = true;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const gql = (
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ) => {
    const req = request(httpServer).post('/graphql').send({ query, variables });
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  async function register(username: string, email: string) {
    const res = await gql(
      `mutation Register($input: RegisterInput!) {
        register(input: $input) { user { id username } accessToken }
      }`,
      {
        input: {
          username,
          email,
          password: 'Str0ng!Pass',
          fullName: username,
        },
      },
    );
    return {
      id: res.body.data.register.user.id,
      token: res.body.data.register.accessToken,
    };
  }

  /** Open a Socket.io client connection authenticated with `token`. */
  function connectSocket(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const port = (httpServer.address() as any).port;
      const sock = io(`http://localhost:${port}`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      sock.on('connect', () => resolve(sock));
      sock.on('connect_error', (err: Error) =>
        reject(new Error(`socket connect failed: ${err.message}`)),
      );
      setTimeout(
        () => reject(new Error('socket connect timeout')),
        3000,
      );
    });
  }

  /**
   * Attempt to connect with an invalid/missing token. The server's
   * `handleConnection` runs async, so the socket may briefly `connect`
   * before being disconnected by the server. This helper resolves with
   * `true` if the socket ends up disconnected (i.e. properly rejected),
   * `false` if it stays connected.
   */
  function expectSocketRejected(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const port = (httpServer.address() as any).port;
      const sock = io(`http://localhost:${port}`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      sock.on('connect', () => {
        // Server may disconnect us shortly — wait up to 500ms
        setTimeout(() => {
          const rejected = !sock.connected;
          sock.disconnect();
          resolve(rejected);
        }, 500);
      });
      sock.on('connect_error', () => {
        sock.disconnect();
        resolve(true); // rejected before even connecting
      });
      sock.on('disconnect', () => {
        // Server kicked us — success!
        resolve(true);
      });
      setTimeout(() => {
        sock.disconnect();
        reject(new Error('expectSocketRejected: no signal within 3s'));
      }, 3000);
    });
  }

  function disconnectSocket(sock: Socket | null): Promise<void> {
    if (!sock) return Promise.resolve();
    return new Promise((resolve) => {
      sock.on('disconnect', () => resolve());
      sock.disconnect();
      // Safety net: resolve even if disconnect event doesn't fire
      setTimeout(resolve, 200);
    });
  }

  // -------------------------------------------------------------------------
  // Setup: register alice, bob, carol
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    const a = await register('rtalice', 'rtalice@e2e.test');
    aliceId = a.id;
    aliceToken = a.token;
    const b = await register('rtbob', 'rtbob@e2e.test');
    bobId = b.id;
    bobToken = b.token;
    const c = await register('rtcarol', 'rtcarol@e2e.test');
    carolId = c.id;
    carolToken = c.token;
  });

  // =================================================================
  // REALTIME — connection & auth
  // =================================================================

  describe('Realtime — connection', () => {
    it('accepts a connection with a valid JWT', async () => {
      const sock = await connectSocket(aliceToken);
      expect(sock.connected).toBe(true);
      await disconnectSocket(sock);
    });

    it('rejects a connection without a token', async () => {
      const rejected = await expectSocketRejected('');
      expect(rejected).toBe(true);
    });

    it('rejects a connection with an invalid token', async () => {
      const rejected = await expectSocketRejected('not-a-jwt');
      expect(rejected).toBe(true);
    });
  });

  // =================================================================
  // REALTIME — message_received delivery
  // =================================================================

  describe('Realtime — message_received', () => {
    let bobSock: Socket | null = null;

    beforeEach(async () => {
      bobSock = await connectSocket(bobToken);
    });
    afterEach(async () => {
      await disconnectSocket(bobSock);
      bobSock = null;
    });

    it('delivers a new message to the recipient in real time', async () => {
      // Bob listens for message_received
      const received = new Promise<any>((resolve) => {
        bobSock!.on('message_received', (payload: any) => resolve(payload));
      });

      // Alice sends Bob a message
      await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { id text }
        }`,
        {
          input: {
            recipientId: bobId,
            text: 'hello from alice',
          },
        },
        aliceToken,
      );

      const payload = await received;
      expect(payload.threadId).toBeDefined();
      expect(payload.message.text).toBe('hello from alice');
      expect(payload.message.sender.username).toBe('rtalice');
    });
  });

  // =================================================================
  // REALTIME — message_read delivery
  // =================================================================

  describe('Realtime — message_read', () => {
    let aliceSock: Socket | null = null;

    beforeEach(async () => {
      aliceSock = await connectSocket(aliceToken);
    });
    afterEach(async () => {
      await disconnectSocket(aliceSock);
      aliceSock = null;
    });

    it('notifies the sender when their messages are read', async () => {
      // 1. Alice sends Bob two messages
      const sendRes = await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { id threadId }
        }`,
        {
          input: { recipientId: bobId, text: 'msg 1' },
        },
        aliceToken,
      );
      const threadId = sendRes.body.data.sendMessage.threadId;
      await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { id }
        }`,
        {
          input: { recipientId: bobId, text: 'msg 2' },
        },
        aliceToken,
      );

      // 2. Alice listens for message_read
      const readEvent = new Promise<any>((resolve) => {
        aliceSock!.on('message_read', (payload: any) => resolve(payload));
      });

      // 3. Bob marks the thread as read
      await gql(
        `mutation MarkRead($threadId: ID!) {
          markThreadRead(threadId: $threadId)
        }`,
        { threadId },
        bobToken,
      );

      const payload = await readEvent;
      expect(payload.threadId).toBe(threadId);
      expect(payload.readerId).toBe(bobId);
      expect(Array.isArray(payload.messageIds)).toBe(true);
      // Note: previous tests may have left unread messages in this thread,
      // so we only assert >= 2 (the ones we just sent), not an exact count.
      expect(payload.messageIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =================================================================
  // REALTIME — message_deleted delivery
  // =================================================================

  describe('Realtime — message_deleted', () => {
    let bobSock: Socket | null = null;

    beforeEach(async () => {
      bobSock = await connectSocket(bobToken);
    });
    afterEach(async () => {
      await disconnectSocket(bobSock);
      bobSock = null;
    });

    it('notifies the recipient when a message is deleted', async () => {
      const sendRes = await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { id threadId }
        }`,
        {
          input: { recipientId: bobId, text: 'oops, will delete' },
        },
        aliceToken,
      );
      const messageId = sendRes.body.data.sendMessage.id;
      const threadId = sendRes.body.data.sendMessage.threadId;

      const deletedEvent = new Promise<any>((resolve) => {
        bobSock!.on('message_deleted', (payload: any) => resolve(payload));
      });

      await gql(
        `mutation Del($id: ID!) { deleteMessage(id: $id) }`,
        { id: messageId },
        aliceToken,
      );

      const payload = await deletedEvent;
      expect(payload.threadId).toBe(threadId);
      expect(payload.messageId).toBe(messageId);
    });
  });

  // =================================================================
  // REALTIME — notification_received delivery
  // =================================================================

  describe('Realtime — notification_received', () => {
    let aliceSock: Socket | null = null;

    beforeEach(async () => {
      aliceSock = await connectSocket(aliceToken);
    });
    afterEach(async () => {
      await disconnectSocket(aliceSock);
      aliceSock = null;
    });

    it('delivers a like notification in real time', async () => {
      // Alice creates a post; Bob likes it → Alice should get a notification_received event
      const postRes = await gql(
        `mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) { id }
        }`,
        {
          input: {
            caption: 'alice likebait',
            mediaUrls: ['https://cdn.test/x.jpg'],
            hashtags: [],
          },
        },
        aliceToken,
      );
      const postId = postRes.body.data.createPost.id;

      const notifEvent = new Promise<any>((resolve) => {
        aliceSock!.on('notification_received', (payload: any) => resolve(payload));
      });

      await gql(
        `mutation Like($postId: ID!) { toggleLike(postId: $postId) }`,
        { postId },
        bobToken,
      );

      const payload = await notifEvent;
      // Note: socket events deliver the raw DB enum value ('like'),
      // not the GraphQL-serialized PascalCase key ('Like').
      expect(payload.notification.type).toBe('like');
      expect(payload.notification.actor.username).toBe('rtbob');
    });

    it('delivers a follow notification in real time', async () => {
      // Carol follows Alice → Alice should get a notification_received event
      const notifEvent = new Promise<any>((resolve) => {
        aliceSock!.on('notification_received', (payload: any) => resolve(payload));
      });

      await gql(
        `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
        { userId: aliceId },
        carolToken,
      );

      const payload = await notifEvent;
      expect(payload.notification.type).toBe('follow');
      expect(payload.notification.actor.username).toBe('rtcarol');
    });
  });

  // =================================================================
  // REALTIME — typing indicator
  // =================================================================

  describe('Realtime — typing', () => {
    let bobSock: Socket | null = null;

    beforeEach(async () => {
      bobSock = await connectSocket(bobToken);
    });
    afterEach(async () => {
      await disconnectSocket(bobSock);
      bobSock = null;
    });

    it('relays a typing indicator to the other participant', async () => {
      // 1. Open a thread between alice and bob (so a thread exists)
      const sendRes = await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { threadId }
        }`,
        {
          input: { recipientId: bobId, text: 'open thread' },
        },
        aliceToken,
      );
      const threadId = sendRes.body.data.sendMessage.threadId;

      // 2. Bob listens for typing
      const typingEvent = new Promise<any>((resolve) => {
        bobSock!.on('typing', (payload: any) => resolve(payload));
      });

      // 3. Alice opens a socket and emits typing
      const aliceSock = await connectSocket(aliceToken);
      try {
        aliceSock.emit('typing', { threadId, isTyping: true });

        const payload = await typingEvent;
        expect(payload.threadId).toBe(threadId);
        expect(payload.userId).toBe(aliceId);
        expect(payload.isTyping).toBe(true);
      } finally {
        await disconnectSocket(aliceSock);
      }
    });

    it('refuses typing from a non-participant (no event delivered)', async () => {
      // 1. Create a thread between alice and bob
      const sendRes = await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { threadId }
        }`,
        {
          input: { recipientId: bobId, text: 'thread' },
        },
        aliceToken,
      );
      const threadId = sendRes.body.data.sendMessage.threadId;

      // 2. Bob listens for typing
      let received = false;
      bobSock!.on('typing', () => {
        received = true;
      });

      // 3. Carol (not a participant) tries to emit typing on that thread
      const carolSock = await connectSocket(carolToken);
      try {
        carolSock.emit('typing', { threadId, isTyping: true });
        // Give the gateway a moment to process
        await new Promise((r) => setTimeout(r, 300));
        expect(received).toBe(false);
      } finally {
        await disconnectSocket(carolSock);
      }
    });
  });

  // =================================================================
  // REALTIME — presence broadcasts
  // =================================================================

  describe('Realtime — presence', () => {
    it('broadcasts presence_update to mutual follows when a user comes online', async () => {
      // 1. Alice and Bob mutually follow each other (need to do this BEFORE
      //    opening Bob's socket, so the mutual-follow list is non-empty when
      //    Alice connects).
      await gql(
        `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
        { userId: aliceId },
        bobToken,
      );
      await gql(
        `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
        { userId: bobId },
        aliceToken,
      );

      // 2. Bob opens a socket (already online from previous tests, but we
      //    re-listen here)
      const bobSock = await connectSocket(bobToken);
      try {
        const presenceEvent = new Promise<any>((resolve) => {
          bobSock.on('presence_update', (payload: any) => {
            // We're looking for Alice coming online
            if (payload.userId === aliceId && payload.isOnline === true) {
              resolve(payload);
            }
          });
        });

        // 3. Alice opens a fresh socket — should trigger presence_update to Bob
        const aliceSock = await connectSocket(aliceToken);
        try {
          const payload = await Promise.race([
            presenceEvent,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('presence timeout')), 2000),
            ),
          ]);
          expect(payload.userId).toBe(aliceId);
          expect(payload.isOnline).toBe(true);
        } finally {
          await disconnectSocket(aliceSock);
        }
      } finally {
        await disconnectSocket(bobSock);
      }
    });

    it('returns online status via the onlineStatus query', async () => {
      const aliceSock = await connectSocket(aliceToken);
      try {
        const res = await gql(
          `query Online($userIds: [ID!]!) {
            onlineStatus(userIds: $userIds) {
              userId
              isOnline
              lastSeenAt
            }
          }`,
          { userIds: [aliceId, bobId] },
          aliceToken,
        );
        expect(res.body.data.onlineStatus).toHaveLength(2);
        const alice = res.body.data.onlineStatus.find(
          (s: any) => s.userId === aliceId,
        );
        const bob = res.body.data.onlineStatus.find(
          (s: any) => s.userId === bobId,
        );
        expect(alice.isOnline).toBe(true);
        expect(alice.lastSeenAt).toBeGreaterThan(0);
        // Bob may or may not be online depending on test order; just assert shape
        expect(typeof bob.isOnline).toBe('boolean');
      } finally {
        await disconnectSocket(aliceSock);
      }
    });
  });

  // =================================================================
  // PUSH — GraphQL subscription management
  // =================================================================

  describe('Push — subscribe / unsubscribe via GraphQL', () => {
    const sampleInput = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      p256dh: 'BPaU-aW1p8Vg11RkzpxD0QOu5Ia5wKfQO8dN9aZ8wJE=',
      auth: 'auth-secret-base64url',
    };

    it('subscribes a new device for the current user', async () => {
      const res = await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) {
            subscription { id endpoint p256dh auth }
            created
          }
        }`,
        { input: sampleInput },
        aliceToken,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.subscribeToPush.created).toBe(true);
      expect(res.body.data.subscribeToPush.subscription.endpoint).toBe(
        sampleInput.endpoint,
      );
    });

    it('is idempotent on re-subscribe (created=false, keys updated)', async () => {
      // First subscribe
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { created }
        }`,
        { input: sampleInput },
        aliceToken,
      );
      // Re-subscribe with updated keys
      const res = await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) {
            subscription { p256dh auth }
            created
          }
        }`,
        {
          input: { ...sampleInput, p256dh: 'new-p256dh', auth: 'new-auth' },
        },
        aliceToken,
      );
      expect(res.body.data.subscribeToPush.created).toBe(false);
      expect(res.body.data.subscribeToPush.subscription.p256dh).toBe('new-p256dh');
    });

    it('lists the current user subscriptions', async () => {
      const res = await gql(
        `query { myPushSubscriptions { id endpoint createdAt } }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myPushSubscriptions.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.myPushSubscriptions.some(
          (s: any) => s.endpoint === sampleInput.endpoint,
        ),
      ).toBe(true);
    });

    it('does not leak another user subscriptions', async () => {
      // Bob subscribes
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: { ...sampleInput, endpoint: 'https://fcm/bob-ep' },
        },
        bobToken,
      );
      // Alice queries — should NOT see Bob's subscription
      const res = await gql(
        `query { myPushSubscriptions { endpoint } }`,
        undefined,
        aliceToken,
      );
      expect(
        res.body.data.myPushSubscriptions.some(
          (s: any) => s.endpoint === 'https://fcm/bob-ep',
        ),
      ).toBe(false);
    });

    it('unsubscribes a device by endpoint', async () => {
      // Subscribe a fresh endpoint
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: { ...sampleInput, endpoint: 'https://fcm/to-remove' },
        },
        aliceToken,
      );
      // Unsubscribe it
      const res = await gql(
        `mutation Unsub($endpoint: String!) {
          unsubscribeFromPush(endpoint: $endpoint) { removed }
        }`,
        { endpoint: 'https://fcm/to-remove' },
        aliceToken,
      );
      expect(res.body.data.unsubscribeFromPush.removed).toBe(1);
    });

    it('unsubscribeAll removes all of the user subscriptions', async () => {
      // Carol: subscribe two endpoints, then unsubscribe all
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: { ...sampleInput, endpoint: 'https://fcm/carol-1' },
        },
        carolToken,
      );
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: { ...sampleInput, endpoint: 'https://fcm/carol-2' },
        },
        carolToken,
      );
      const res = await gql(
        `mutation { unsubscribeAllPush { removed } }`,
        undefined,
        carolToken,
      );
      expect(res.body.data.unsubscribeAllPush.removed).toBe(2);

      // Verify: Carol now has zero subscriptions
      const list = await gql(
        `query { myPushSubscriptions { endpoint } }`,
        undefined,
        carolToken,
      );
      expect(list.body.data.myPushSubscriptions).toHaveLength(0);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await gql(
        `query { myPushSubscriptions { endpoint } }`,
        undefined,
        // no token
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // =================================================================
  // PUSH — actual delivery (mocked)
  // =================================================================

  describe('Push — delivery on new DM', () => {
    it('calls webpush.sendNotification when a DM is sent to a subscribed user', async () => {
      // 1. Bob subscribes to push
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: {
            endpoint: 'https://fcm/dm-delivery-ep',
            p256dh: 'p256dh',
            auth: 'auth',
          },
        },
        bobToken,
      );

      // 2. Alice sends Bob a message → should trigger a push
      jest.clearAllMocks();
      // Re-apply the mock implementation in case clearAllMocks cleared it
      (webpush.sendNotification as jest.Mock).mockResolvedValue({ statusCode: 201 });
      await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) { id }
        }`,
        {
          input: { recipientId: bobId, text: 'push me' },
        },
        aliceToken,
      );
      // Give the async push call a moment to complete
      await new Promise((r) => setTimeout(r, 200));

      // 3. webpush.sendNotification should have been called once for Bob
      expect((webpush.sendNotification as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
      const payloadArg = (webpush.sendNotification as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(payloadArg);
      expect(parsed.title).toBe('@rtalice');
      expect(parsed.body).toContain('push me');
    });
  });

  describe('Push — delivery on new notification', () => {
    it('calls webpush.sendNotification when a like creates a notification for a subscribed user', async () => {
      // 1. Alice subscribes to push
      await gql(
        `mutation Sub($input: SubscribePushInput!) {
          subscribeToPush(input: $input) { subscription { id } }
        }`,
        {
          input: {
            endpoint: 'https://fcm/notif-delivery-ep',
            p256dh: 'p256dh',
            auth: 'auth',
          },
        },
        aliceToken,
      );

      // 2. Alice creates a post
      const postRes = await gql(
        `mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) { id }
        }`,
        {
          input: {
            caption: 'alice pushbait',
            mediaUrls: ['https://cdn.test/x.jpg'],
            hashtags: [],
          },
        },
        aliceToken,
      );
      const postId = postRes.body.data.createPost.id;

      // 3. Bob likes the post → should trigger a push to Alice
      jest.clearAllMocks();
      (webpush.sendNotification as jest.Mock).mockResolvedValue({ statusCode: 201 });
      await gql(
        `mutation Like($postId: ID!) { toggleLike(postId: $postId) }`,
        { postId },
        bobToken,
      );
      // Give the async push call a moment to complete
      await new Promise((r) => setTimeout(r, 200));

      // 4. webpush.sendNotification should have been called
      expect((webpush.sendNotification as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
      const payloadArg = (webpush.sendNotification as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(payloadArg);
      expect(parsed.title).toBe('Pixora');
      expect(parsed.body).toContain('پسندید');
    });
  });
});
