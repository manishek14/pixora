import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * End-to-end tests for Phase 4 features:
 *  - Notifications (created via likes/comments/follows; queried & marked read)
 *  - Direct Messages (send, list threads, mark read, unread count)
 *  - Search (users / posts / reels / hashtags / unified)
 *
 * Boots the full AppModule against an in-memory SQLite DB and exercises the
 * GraphQL surface via supertest.
 */
describe('Phase 4 E2E — Notifications + Messages + Search', () => {
  let app: INestApplication;
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
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = (
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ) => {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
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

  async function createPost(
    token: string,
    caption: string,
    opts: { mediaUrls?: string[]; hashtags?: string[] } = {},
  ) {
    const res = await gql(
      `mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) { id caption }
      }`,
      {
        input: {
          caption,
          mediaUrls: opts.mediaUrls ?? ['https://cdn.test/p.jpg'],
          hashtags: opts.hashtags ?? [],
        },
      },
      token,
    );
    return res.body.data.createPost;
  }

  async function createReel(token: string, input: { videoUrl: string; caption?: string; durationSeconds?: number }) {
    const res = await gql(
      `mutation CreateReel($input: CreateReelInput!) {
        createReel(input: $input) { id isReel caption }
      }`,
      {
        input: {
          videoUrl: input.videoUrl,
          caption: input.caption,
          durationSeconds: input.durationSeconds ?? 15,
        },
      },
      token,
    );
    return res.body.data.createReel;
  }

  beforeAll(async () => {
    const a = await register('alice', 'alice@e2e.test');
    aliceId = a.id;
    aliceToken = a.token;
    const b = await register('bob', 'bob@e2e.test');
    bobId = b.id;
    bobToken = b.token;
    const c = await register('carol', 'carol@e2e.test');
    carolId = c.id;
    carolToken = c.token;
  });

  // =================================================================
  // NOTIFICATIONS
  // =================================================================
  describe('Notifications', () => {
    it('creates a like notification when bob likes alice post', async () => {
      const post = await createPost(aliceToken, 'alice post');
      await gql(
        `mutation Like($postId: ID!) { toggleLike(postId: $postId) }`,
        { postId: post.id },
        bobToken,
      );
      const res = await gql(
        `query { myNotifications(limit: 10) { items { type isRead actor { username } } unreadCount } }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myNotifications.items).toHaveLength(1);
      expect(res.body.data.myNotifications.items[0].type).toBe('Like');
      expect(res.body.data.myNotifications.items[0].isRead).toBe(false);
      expect(res.body.data.myNotifications.items[0].actor.username).toBe('bob');
      expect(res.body.data.myNotifications.unreadCount).toBe(1);
    });

    it('creates a comment notification', async () => {
      const post = await createPost(aliceToken, 'alice post for comment');
      await gql(
        `mutation Comment($input: CreateCommentInput!) {
          createComment(input: $input) { id text }
        }`,
        { input: { postId: post.id, text: 'nice post!' } },
        bobToken,
      );
      const res = await gql(
        `query { myNotifications(limit: 10) { items { type } } }`,
        undefined,
        aliceToken,
      );
      const types = res.body.data.myNotifications.items.map((n: any) => n.type);
      expect(types).toContain('Comment');
    });

    it('creates a follow notification', async () => {
      await gql(
        `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
        { userId: aliceId },
        bobToken,
      );
      const res = await gql(
        `query { myNotifications(limit: 20) { items { type actor { username } } } }`,
        undefined,
        aliceToken,
      );
      const types = res.body.data.myNotifications.items.map((n: any) => n.type);
      expect(types).toContain('Follow');
    });

    it('does NOT create a notification when user likes own post', async () => {
      const post = await createPost(aliceToken, 'alice own post');
      await gql(
        `mutation Like($postId: ID!) { toggleLike(postId: $postId) }`,
        { postId: post.id },
        aliceToken,
      );
      const res = await gql(
        `query { myNotifications(limit: 50) { items { type entityId } } }`,
        undefined,
        aliceToken,
      );
      // The self-like notification should NOT exist for this specific post
      const ownLikeNotif = res.body.data.myNotifications.items.find(
        (n: any) => n.type === 'Like' && n.entityId === post.id,
      );
      expect(ownLikeNotif).toBeUndefined();
    });

    it('returns correct unread count via myUnreadNotificationsCount', async () => {
      const res = await gql(
        `query { myUnreadNotificationsCount }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myUnreadNotificationsCount).toBeGreaterThan(0);
    });

    it('marks a single notification as read', async () => {
      // Get one notification
      const list = await gql(
        `query { myNotifications(limit: 1) { items { id isRead } } }`,
        undefined,
        aliceToken,
      );
      const notifId = list.body.data.myNotifications.items[0].id;
      const res = await gql(
        `mutation Mark($id: ID!) { markNotificationRead(id: $id) { id isRead } }`,
        { id: notifId },
        aliceToken,
      );
      expect(res.body.data.markNotificationRead.isRead).toBe(true);
    });

    it('marks all notifications as read', async () => {
      const res = await gql(
        `mutation { markAllNotificationsRead }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.markAllNotificationsRead).toBeGreaterThan(0);
      const after = await gql(
        `query { myUnreadNotificationsCount }`,
        undefined,
        aliceToken,
      );
      expect(after.body.data.myUnreadNotificationsCount).toBe(0);
    });

    it('deletes a notification', async () => {
      // Create a fresh notification by liking another post
      const post = await createPost(aliceToken, 'post to delete notif');
      await gql(
        `mutation Like($postId: ID!) { toggleLike(postId: $postId) }`,
        { postId: post.id },
        carolToken,
      );
      const list = await gql(
        `query { myNotifications(limit: 50, onlyUnread: true) { items { id type } } }`,
        undefined,
        aliceToken,
      );
      const notif = list.body.data.myNotifications.items.find((n: any) => n.type === 'Like');
      expect(notif).toBeDefined();
      const del = await gql(
        `mutation Del($id: ID!) { deleteNotification(id: $id) }`,
        { id: notif.id },
        aliceToken,
      );
      expect(del.body.data.deleteNotification).toBe(true);
    });

    it('rejects unauthenticated access', async () => {
      const res = await gql(`query { myNotifications(limit: 10) { items { id } } }`);
      expect(res.body.errors).toBeDefined();
    });
  });

  // =================================================================
  // DIRECT MESSAGES
  // =================================================================
  describe('Direct Messages', () => {
    it('sends a message from alice to bob', async () => {
      const res = await gql(
        `mutation Send($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id text isRead sender { username }
          }
        }`,
        { input: { recipientId: bobId, text: 'hi bob!' } },
        aliceToken,
      );
      expect(res.body.data.sendMessage.text).toBe('hi bob!');
      expect(res.body.data.sendMessage.isRead).toBe(false);
      expect(res.body.data.sendMessage.sender.username).toBe('alice');
    });

    it('lists threads for bob with alice as the other participant', async () => {
      const res = await gql(
        `query { myThreads(limit: 20) { items { id userA { username } userB { username } messages { text sender { username } } } unreadCount hasMore } }`,
        undefined,
        bobToken,
      );
      expect(res.body.data.myThreads.items).toHaveLength(1);
      const t = res.body.data.myThreads.items[0];
      const participants = [t.userA.username, t.userB.username].sort();
      expect(participants).toEqual(['alice', 'bob']);
      expect(t.messages).toHaveLength(1);
      expect(t.messages[0].text).toBe('hi bob!');
      expect(t.messages[0].sender.username).toBe('alice');
      expect(res.body.data.myThreads.unreadCount).toBe(1);
    });

    it('reuses the same thread when sending another message', async () => {
      await gql(
        `mutation Send($input: SendMessageInput!) { sendMessage(input: $input) { id } }`,
        { input: { recipientId: bobId, text: 'second message' } },
        aliceToken,
      );
      const res = await gql(
        `query { myThreads(limit: 20) { items { id } } }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myThreads.items).toHaveLength(1);
    });

    it('opens an existing thread via threadWithUser query', async () => {
      const res = await gql(
        `query ThreadWithUser($userId: ID!) {
          threadWithUser(userId: $userId) {
            id userA { username } userB { username } messages { text }
          }
        }`,
        { userId: bobId },
        aliceToken,
      );
      expect(res.body.data.threadWithUser).toBeDefined();
      expect(res.body.data.threadWithUser.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('marks thread as read — returns count of updated messages', async () => {
      // First get the thread id
      const list = await gql(
        `query { myThreads(limit: 5) { items { id } } }`,
        undefined,
        bobToken,
      );
      const threadId = list.body.data.myThreads.items[0].id;
      const res = await gql(
        `mutation MarkRead($threadId: ID!) { markThreadRead(threadId: $threadId) }`,
        { threadId },
        bobToken,
      );
      expect(res.body.data.markThreadRead).toBeGreaterThanOrEqual(1);
      // Unread count should be 0 for bob now
      const after = await gql(
        `query { myThreads(limit: 5) { unreadCount } }`,
        undefined,
        bobToken,
      );
      expect(after.body.data.myThreads.unreadCount).toBe(0);
    });

    it('returns unread count across all threads', async () => {
      // Send a fresh incoming message to carol from alice
      await gql(
        `mutation Send($input: SendMessageInput!) { sendMessage(input: $input) { id } }`,
        { input: { recipientId: carolId, text: 'hi carol' } },
        aliceToken,
      );
      const res = await gql(
        `query { unreadMessagesCount }`,
        undefined,
        carolToken,
      );
      expect(res.body.data.unreadMessagesCount).toBeGreaterThanOrEqual(1);
    });

    it('rejects sending a message to self', async () => {
      const res = await gql(
        `mutation Send($input: SendMessageInput!) { sendMessage(input: $input) { id } }`,
        { input: { recipientId: aliceId, text: 'self' } },
        aliceToken,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('rejects unauthenticated access', async () => {
      const res = await gql(`query { myThreads(limit: 10) { items { id } } }`);
      expect(res.body.errors).toBeDefined();
    });

    it('forbids reading a thread the user is not a participant of', async () => {
      // Open a brand-new thread between alice and bob (carol is not a participant)
      const thread = await gql(
        `query ThreadWithUser($userId: ID!) {
          threadWithUser(userId: $userId) { id userA { username } userB { username } }
        }`,
        { userId: bobId },
        aliceToken,
      );
      const threadId = thread.body.data.threadWithUser.id;
      // Verify carol is NOT one of the participants
      const participants = thread.body.data.threadWithUser.userA.username === 'carol' ||
        thread.body.data.threadWithUser.userB.username === 'carol';
      expect(participants).toBe(false);
      // Carol tries to read it — must fail
      const res = await gql(
        `query Thread($id: ID!) { thread(id: $id) { id } }`,
        { id: threadId },
        carolToken,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // =================================================================
  // SEARCH
  // =================================================================
  describe('Search', () => {
    beforeAll(async () => {
      // Create some searchable content
      await createPost(aliceToken, 'Beautiful sunset over Tehran', { hashtags: ['sunset', 'tehran'] });
      await createPost(aliceToken, 'City skyline at night', { hashtags: ['city', 'night'] });
      await createReel(bobToken, { videoUrl: 'https://cdn.test/r.mp4', caption: 'sunset timelapse reel' });
    });

    it('searches users by username', async () => {
      const res = await gql(
        `query SearchUsers($q: String!) { searchUsers(query: $q) { id username } }`,
        { q: 'ali' },
      );
      expect(res.body.data.searchUsers.length).toBeGreaterThanOrEqual(1);
      const usernames = res.body.data.searchUsers.map((u: any) => u.username);
      expect(usernames).toContain('alice');
    });

    it('searches users by fullName', async () => {
      const res = await gql(
        `query SearchUsers($q: String!) { searchUsers(query: $q) { id username } }`,
        { q: 'carol' },
      );
      expect(res.body.data.searchUsers.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty list for empty query', async () => {
      const res = await gql(
        `query SearchUsers($q: String!) { searchUsers(query: $q) { id } }`,
        { q: '' },
      );
      expect(res.body.data.searchUsers).toHaveLength(0);
    });

    it('searches posts by caption (excludes reels)', async () => {
      const res = await gql(
        `query SearchPosts($q: String!) { searchPosts(query: $q) { id caption isReel } }`,
        { q: 'sunset' },
      );
      expect(res.body.data.searchPosts.length).toBeGreaterThanOrEqual(1);
      // Reels should NOT show up in searchPosts
      for (const p of res.body.data.searchPosts) {
        expect(p.isReel).toBe(false);
      }
    });

    it('searches reels by caption (excludes regular posts)', async () => {
      const res = await gql(
        `query SearchReels($q: String!) { searchReels(query: $q) { id caption isReel } }`,
        { q: 'sunset' },
      );
      expect(res.body.data.searchReels.length).toBeGreaterThanOrEqual(1);
      for (const r of res.body.data.searchReels) {
        expect(r.isReel).toBe(true);
      }
    });

    it('searches hashtags — returns tag with posts vs reels counts', async () => {
      const res = await gql(
        `query SearchHashtags($q: String!) { searchHashtags(query: $q) { tag postsCount reelsCount total } }`,
        { q: 'sun' },
      );
      expect(res.body.data.searchHashtags.length).toBeGreaterThanOrEqual(1);
      const sunset = res.body.data.searchHashtags.find((h: any) => h.tag === 'sunset');
      expect(sunset).toBeDefined();
      expect(sunset.total).toBeGreaterThanOrEqual(1);
    });

    it('performs unified search across all categories', async () => {
      const res = await gql(
        `query SearchAll($q: String!) {
          searchAll(query: $q) {
            users { id username }
            posts { id }
            reels { id }
            hashtags { tag }
          }
        }`,
        { q: 'sunset' },
      );
      expect(res.body.data.searchAll.users.length).toBeGreaterThanOrEqual(0);
      expect(res.body.data.searchAll.posts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.searchAll.reels.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.searchAll.hashtags.length).toBeGreaterThanOrEqual(1);
    });

    it('does not require authentication', async () => {
      const res = await gql(
        `query SearchUsers($q: String!) { searchUsers(query: $q) { id } }`,
        { q: 'alice' },
        // no token
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.searchUsers.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =================================================================
  // CROSS-MODULE INTEGRATION
  // =================================================================
  describe('Cross-module integration', () => {
    it('a message thread can be opened even if no messages exist yet', async () => {
      // Bob and Carol haven't DM'd yet — opening a thread should create it
      const res = await gql(
        `query ThreadWithUser($userId: ID!) {
          threadWithUser(userId: $userId) {
            id userA { username } userB { username } messages { id }
          }
        }`,
        { userId: carolId },
        bobToken,
      );
      expect(res.body.data.threadWithUser).toBeDefined();
      expect(res.body.data.threadWithUser.messages).toHaveLength(0);
      const participants = [res.body.data.threadWithUser.userA.username, res.body.data.threadWithUser.userB.username].sort();
      expect(participants).toEqual(['bob', 'carol']);
    });

    it('notifications, messages, and search all coexist without interference', async () => {
      // Sanity: like a post (creates notification), send a DM (no notification),
      // search for the post — all should work independently.
      const post = await createPost(aliceToken, 'integration test post');
      await gql(`mutation Like($postId: ID!) { toggleLike(postId: $postId) }`, { postId: post.id }, bobToken);
      await gql(
        `mutation Send($input: SendMessageInput!) { sendMessage(input: $input) { id } }`,
        { input: { recipientId: aliceId, text: 'integration msg' } },
        bobToken,
      );
      const search = await gql(
        `query SearchAll($q: String!) {
          searchAll(query: $q) { posts { id caption } }
        }`,
        { q: 'integration' },
      );
      expect(search.body.data.searchAll.posts.length).toBeGreaterThanOrEqual(1);

      const notifs = await gql(
        `query { myNotifications(limit: 50) { items { type } } }`,
        undefined,
        aliceToken,
      );
      const types = notifs.body.data.myNotifications.items.map((n: any) => n.type);
      expect(types).toContain('Like');
      // DMs do NOT create notifications (per design)
      expect(types).not.toContain('Message');
    });
  });
});
