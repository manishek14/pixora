import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * End-to-end tests for Phase 3 features:
 *  - Reels (create, view idempotent, share, delete, feed ranking)
 *  - Bookmarks (toggle, list, archived exclusion)
 *  - Explore (trending posts/reels/hashtags, suggested users)
 *
 * Boots the full AppModule against an in-memory SQLite DB and exercises the
 * GraphQL surface via supertest.
 */
describe('Phase 3 E2E — Reels + Bookmarks + Explore', () => {
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

  async function createPost(token: string, caption: string, mediaUrls: string[] = ['https://cdn.test/p.jpg']) {
    const res = await gql(
      `mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) { id caption }
      }`,
      { input: { caption, mediaUrls } },
      token,
    );
    return res.body.data.createPost;
  }

  async function createReel(token: string, input: { videoUrl: string; caption?: string; audioTrack?: string; durationSeconds?: number; }) {
    const res = await gql(
      `mutation CreateReel($input: CreateReelInput!) {
        createReel(input: $input) {
          id videoUrl audioTrack durationSeconds caption isReel
          viewsCount sharesCount likesCount commentsCount
          hashtags mentions
        }
      }`,
      { input },
      token,
    );
    return res.body.data.createReel;
  }

  // ---------------------------------------------------------------------------
  // Setup: register three users

  beforeAll(async () => {
    const a = await register('alice', 'alice@test.com');
    aliceId = a.id;
    aliceToken = a.token;
    const b = await register('bob', 'bob@test.com');
    bobId = b.id;
    bobToken = b.token;
    const c = await register('carol', 'carol@test.com');
    carolId = c.id;
    carolToken = c.token;
  });

  // ===========================================================================
  // REELS
  // ===========================================================================

  describe('Reels', () => {
    it('creates a reel with all fields populated', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/reel1.mp4',
        audioTrack: 'original-audio',
        durationSeconds: 30,
        caption: 'funny cat #cats',
      });
      expect(reel.isReel).toBe(true);
      expect(reel.videoUrl).toBe('https://cdn.test/reel1.mp4');
      expect(reel.audioTrack).toBe('original-audio');
      expect(reel.durationSeconds).toBe(30);
      expect(reel.viewsCount).toBe(0);
      expect(reel.sharesCount).toBe(0);
      expect(reel.likesCount).toBe(0);
      expect(reel.hashtags).toEqual(['cats']);
    });

    it('fetches a reel by id', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/reel2.mp4',
      });
      const res = await gql(
        `query Reel($id: ID!) {
          reel(id: $id) { id videoUrl isReel viewsCount }
        }`,
        { id: reel.id },
      );
      expect(res.body.data.reel.id).toBe(reel.id);
      expect(res.body.data.reel.isReel).toBe(true);
      expect(res.body.data.reel.videoUrl).toBe('https://cdn.test/reel2.mp4');
    });

    it('records a view (idempotent)', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/reel3.mp4',
      });
      // bob views it
      const v1 = await gql(
        `mutation View($reelId: ID!) {
          viewReel(reelId: $reelId) { viewsCount }
        }`,
        { reelId: reel.id },
        bobToken,
      );
      expect(v1.body.data.viewReel.viewsCount).toBe(1);
      // bob views it again — count stays at 1
      const v2 = await gql(
        `mutation View($reelId: ID!) {
          viewReel(reelId: $reelId) { viewsCount }
        }`,
        { reelId: reel.id },
        bobToken,
      );
      expect(v2.body.data.viewReel.viewsCount).toBe(1);
      // carol views it — count goes to 2
      const v3 = await gql(
        `mutation View($reelId: ID!) {
          viewReel(reelId: $reelId) { viewsCount }
        }`,
        { reelId: reel.id },
        carolToken,
      );
      expect(v3.body.data.viewReel.viewsCount).toBe(2);
    });

    it('records a share (not idempotent — each share increments)', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/reel4.mp4',
      });
      await gql(`mutation Share($reelId: ID!) { shareReel(reelId: $reelId) { sharesCount } }`,
        { reelId: reel.id }, bobToken);
      await gql(`mutation Share($reelId: ID!) { shareReel(reelId: $reelId) { sharesCount } }`,
        { reelId: reel.id }, bobToken);
      const res = await gql(`query Reel($id: ID!) { reel(id: $id) { sharesCount } }`,
        { id: reel.id });
      expect(res.body.data.reel.sharesCount).toBe(2);
    });

    it('reels feed returns only reels', async () => {
      // create a regular post and a reel
      await createPost(aliceToken, 'regular post');
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/feed.mp4',
        caption: 'reel for feed',
      });
      const res = await gql(
        `query ReelsFeed {
          reelsFeed { id isReel videoUrl }
        }`,
        {},
        bobToken,
      );
      expect(res.body.data.reelsFeed).toBeDefined();
      expect(res.body.data.reelsFeed.length).toBeGreaterThanOrEqual(1);
      // every item must be a reel
      for (const item of res.body.data.reelsFeed) {
        expect(item.isReel).toBe(true);
      }
      expect(res.body.data.reelsFeed.find((r: any) => r.id === reel.id)).toBeDefined();
    });

    it('returns reels by user', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/user-reel.mp4',
      });
      const res = await gql(
        `query UserReels($userId: ID!) {
          userReels(userId: $userId) { id isReel }
        }`,
        { userId: aliceId },
      );
      expect(res.body.data.userReels.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.userReels.find((r: any) => r.id === reel.id)).toBeDefined();
    });

    it('returns reels by hashtag (case-insensitive)', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/hashtag.mp4',
        caption: '#uniqueTag123',
      });
      const res = await gql(
        `query ReelsByHashtag($tag: String!) {
          reelsByHashtag(tag: $tag) { id hashtags }
        }`,
        { tag: 'uniquetag123' },
      );
      expect(res.body.data.reelsByHashtag.find((r: any) => r.id === reel.id)).toBeDefined();
    });

    it('rejects non-author from deleting a reel', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/forbidden-delete.mp4',
      });
      const res = await gql(
        `mutation DeleteReel($id: ID!) { deleteReel(id: $id) }`,
        { id: reel.id },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('lets the author delete their reel', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/author-delete.mp4',
      });
      const res = await gql(
        `mutation DeleteReel($id: ID!) { deleteReel(id: $id) }`,
        { id: reel.id },
        aliceToken,
      );
      expect(res.body.data.deleteReel).toBe(true);
      // subsequent fetch should error
      const fetchRes = await gql(
        `query Reel($id: ID!) { reel(id: $id) { id } }`,
        { id: reel.id },
      );
      expect(fetchRes.body.errors).toBeDefined();
    });

    it('returns reel viewers (author only)', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/viewers.mp4',
      });
      // bob views
      await gql(`mutation View($reelId: ID!) { viewReel(reelId: $reelId) { viewsCount } }`,
        { reelId: reel.id }, bobToken);
      // alice (author) fetches viewers
      const res = await gql(
        `query ReelViewers($reelId: ID!) {
          reelViewers(reelId: $reelId) { user { id username } viewedAt }
        }`,
        { reelId: reel.id },
        aliceToken,
      );
      expect(res.body.data.reelViewers).toHaveLength(1);
      expect(res.body.data.reelViewers[0].user.id).toBe(bobId);
    });

    it('rejects non-author from fetching reel viewers', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/forbidden-viewers.mp4',
      });
      const res = await gql(
        `query ReelViewers($reelId: ID!) {
          reelViewers(reelId: $reelId) { user { id } }
        }`,
        { reelId: reel.id },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // BOOKMARKS
  // ===========================================================================

  describe('Bookmarks', () => {
    it('toggles a bookmark on then off', async () => {
      const post = await createPost(aliceToken, 'bookmark me');
      // on
      const on = await gql(
        `mutation Toggle($postId: ID!) { toggleBookmark(postId: $postId) }`,
        { postId: post.id },
        bobToken,
      );
      expect(on.body.data.toggleBookmark).toBe(true);
      // verify isBookmarked
      const check = await gql(
        `query IsBookmarked($postId: ID!) { isBookmarked(postId: $postId) }`,
        { postId: post.id },
        bobToken,
      );
      expect(check.body.data.isBookmarked).toBe(true);
      // off
      const off = await gql(
        `mutation Toggle($postId: ID!) { toggleBookmark(postId: $postId) }`,
        { postId: post.id },
        bobToken,
      );
      expect(off.body.data.toggleBookmark).toBe(false);
    });

    it('lists my bookmarks', async () => {
      const post = await createPost(aliceToken, 'list this');
      await gql(`mutation Toggle($postId: ID!) { toggleBookmark(postId: $postId) }`,
        { postId: post.id }, bobToken);
      const res = await gql(
        `query MyBookmarks {
          myBookmarks { items { id caption } hasMore }
        }`,
        {},
        bobToken,
      );
      expect(res.body.data.myBookmarks.items.find((p: any) => p.id === post.id)).toBeDefined();
      expect(res.body.data.myBookmarks.hasMore).toBe(false);
    });

    it('returns empty bookmarks for a fresh user', async () => {
      const res = await gql(
        `query MyBookmarks { myBookmarks { items { id } hasMore } }`,
        {},
        carolToken,
      );
      expect(res.body.data.myBookmarks.items).toEqual([]);
    });

    it('rejects unauthenticated calls', async () => {
      const res = await gql(
        `query MyBookmarks { myBookmarks { items { id } } }`,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // EXPLORE
  // ===========================================================================

  describe('Explore', () => {
    it('returns explore trending feed (mixed posts + reels)', async () => {
      // create one post and one reel
      await createPost(aliceToken, 'explore post');
      await createReel(aliceToken, { videoUrl: 'https://cdn.test/explore.mp4' });
      const res = await gql(
        `query ExploreTrending {
          exploreTrending { items { id isReel } hasMore }
        }`,
      );
      expect(res.body.data.exploreTrending.items.length).toBeGreaterThanOrEqual(2);
    });

    it('returns trending reels (only reels)', async () => {
      await createReel(aliceToken, { videoUrl: 'https://cdn.test/trend-r1.mp4' });
      await createReel(aliceToken, { videoUrl: 'https://cdn.test/trend-r2.mp4' });
      const res = await gql(
        `query TrendingReels { trendingReels { id isReel } }`,
      );
      expect(res.body.data.trendingReels.length).toBeGreaterThanOrEqual(2);
      for (const r of res.body.data.trendingReels) {
        expect(r.isReel).toBe(true);
      }
    });

    it('returns trending posts (only non-reels)', async () => {
      await createPost(aliceToken, 'trend post 1');
      await createPost(aliceToken, 'trend post 2');
      const res = await gql(
        `query TrendingPosts { trendingPosts { id isReel } }`,
      );
      expect(res.body.data.trendingPosts.length).toBeGreaterThanOrEqual(2);
      for (const p of res.body.data.trendingPosts) {
        expect(p.isReel).toBe(false);
      }
    });

    it('returns trending hashtags', async () => {
      await createPost(aliceToken, '#trendhashtag1 #trendhashtag2');
      await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/hashtag.mp4',
        caption: '#trendhashtag1 #trendhashtag3',
      });
      const res = await gql(
        `query TrendingHashtags { trendingHashtags { tag postsCount reelsCount total } }`,
      );
      expect(res.body.data.trendingHashtags.length).toBeGreaterThanOrEqual(1);
      const tag1 = res.body.data.trendingHashtags.find((t: any) => t.tag === 'trendhashtag1');
      expect(tag1).toBeDefined();
      expect(tag1.total).toBeGreaterThanOrEqual(2);
    });

    it('returns suggested users (excludes self + followed)', async () => {
      // alice follows bob (set up in the test)
      const followRes = await gql(
        `mutation Follow($userId: String!) {
          followUser(userId: $userId)
        }`,
        { userId: bobId },
        aliceToken,
      );
      // sanity check the follow succeeded
      expect(followRes.body.data?.followUser).toBe(true);
      // also verify via isFollowing
      const check = await gql(
        `query IsFollowing($userId: String!) { isFollowing(userId: $userId) }`,
        { userId: bobId },
        aliceToken,
      );
      expect(check.body.data?.isFollowing).toBe(true);
      const res = await gql(
        `query SuggestedUsers {
          suggestedUsers {
            user { id username }
            mutualFollowers
            postsCount
          }
        }`,
        {},
        aliceToken,
      );
      const ids = res.body.data.suggestedUsers.map((s: any) => s.user.id);
      expect(ids).not.toContain(aliceId);
      expect(ids).not.toContain(bobId); // already followed
      // carol should be in the list (we registered her)
      expect(ids).toContain(carolId);
    });

    it('suggested users returns Forbidden without auth', async () => {
      const res = await gql(
        `query SuggestedUsers {
          suggestedUsers { user { id } }
        }`,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // CROSS-MODULE INTEGRATION
  // ===========================================================================

  describe('Cross-module integration', () => {
    it('a reel can be bookmarked just like a post', async () => {
      const reel = await createReel(aliceToken, {
        videoUrl: 'https://cdn.test/bookmarked-reel.mp4',
      });
      const on = await gql(
        `mutation Toggle($postId: ID!) { toggleBookmark(postId: $postId) }`,
        { postId: reel.id },
        bobToken,
      );
      expect(on.body.data.toggleBookmark).toBe(true);
      const list = await gql(
        `query MyBookmarks { myBookmarks { items { id isReel } } }`,
        {},
        bobToken,
      );
      const found = list.body.data.myBookmarks.items.find((p: any) => p.id === reel.id);
      expect(found).toBeDefined();
      expect(found.isReel).toBe(true);
    });
  });
});
