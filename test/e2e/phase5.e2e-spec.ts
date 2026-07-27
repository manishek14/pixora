import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * End-to-end tests for Phase 5 features:
 *  - Blocks (block / unblock / list / isBlocked)
 *  - Mutes (mute posts / mute stories / unmute / list)
 *  - Suggestions (mutual-friend ranking, verified-user fallback, exclusion rules)
 *  - Collections (create / list / get / update / delete / add item / remove item)
 *  - Cross-module integration (block affects follows, likes, comments, messages, search)
 *
 * Boots the full AppModule against an in-memory SQLite DB and exercises the
 * GraphQL surface via supertest.
 */
describe('Phase 5 E2E — Blocks + Mutes + Suggestions + Collections', () => {
  let app: INestApplication;
  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let carolToken: string;
  let carolId: string;
  let daveToken: string;
  let daveId: string;

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

  async function createPost(token: string, caption: string) {
    const res = await gql(
      `mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) { id caption }
      }`,
      {
        input: {
          caption,
          mediaUrls: ['https://cdn.test/p.jpg'],
        },
      },
      token,
    );
    return res.body.data.createPost;
  }

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
    const d = await register('dave', 'dave@test.com');
    daveId = d.id;
    daveToken = d.token;
  });

  // ===========================================================================
  // BLOCKS
  // ===========================================================================
  describe('Blocks', () => {
    it('lets alice block bob', async () => {
      const res = await gql(
        `mutation BlockUser($userId: ID!) {
          blockUser(userId: $userId) { id blockerId blockedId }
        }`,
        { userId: bobId },
        aliceToken,
      );
      expect(res.body.data.blockUser.blockerId).toBe(aliceId);
      expect(res.body.data.blockUser.blockedId).toBe(bobId);
    });

    it('isBlocked returns true for the block', async () => {
      const res = await gql(
        `query IsBlocked($userId: ID!) {
          isBlocked(userId: $userId)
        }`,
        { userId: bobId },
        aliceToken,
      );
      expect(res.body.data.isBlocked).toBe(true);
    });

    it('myBlocks lists blocked users', async () => {
      const res = await gql(
        `query MyBlocks {
          myBlocks { id blocked { id username } }
        }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myBlocks).toHaveLength(1);
      expect(res.body.data.myBlocks[0].blocked.username).toBe('bob');
    });

    it('prevents blocked user from following the blocker', async () => {
      const res = await gql(
        `mutation FollowUser($userId: String!) {
          followUser(userId: $userId)
        }`,
        { userId: aliceId },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('cannot follow');
    });

    it('prevents blocked user from liking the blocker\'s post', async () => {
      // alice creates a post
      const post = await createPost(aliceToken, 'block test');
      const res = await gql(
        `mutation ToggleLike($postId: ID!) {
          toggleLike(postId: $postId)
        }`,
        { postId: post.id },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('cannot interact');
    });

    it('prevents blocked user from commenting on the blocker\'s post', async () => {
      const post = await createPost(aliceToken, 'comment block test');
      const res = await gql(
        `mutation CreateComment($input: CreateCommentInput!) {
          createComment(input: $input) { id }
        }`,
        { input: { postId: post.id, text: 'hi' } },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('cannot interact');
    });

    it('prevents blocked user from DMing the blocker', async () => {
      const res = await gql(
        `mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) { id text }
        }`,
        { input: { recipientId: aliceId, text: 'hi' } },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('cannot send');
    });

    it('hides blocked users from search results', async () => {
      const res = await gql(
        `query SearchUsers($query: String!) {
          searchUsers(query: $query) { id username }
        }`,
        { query: 'bob' },
        aliceToken,
      );
      expect(res.body.data.searchUsers).toHaveLength(0);
    });

    it('lets alice unblock bob', async () => {
      const res = await gql(
        `mutation UnblockUser($userId: ID!) {
          unblockUser(userId: $userId)
        }`,
        { userId: bobId },
        aliceToken,
      );
      expect(res.body.data.unblockUser).toBe(true);
    });

    it('after unblock, bob can follow alice again', async () => {
      const res = await gql(
        `mutation FollowUser($userId: String!) {
          followUser(userId: $userId)
        }`,
        { userId: aliceId },
        bobToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.followUser).toBe(true);
    });

    it('rejects unauthenticated block attempts', async () => {
      const res = await gql(
        `mutation BlockUser($userId: ID!) {
          blockUser(userId: $userId) { id }
        }`,
        { userId: bobId },
      );
      expect(res.body.errors).toBeDefined();
    });

    it('rejects blocking self', async () => {
      const res = await gql(
        `mutation BlockUser($userId: ID!) {
          blockUser(userId: $userId) { id }
        }`,
        { userId: aliceId },
        aliceToken,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // MUTES
  // ===========================================================================
  describe('Mutes', () => {
    // Setup: bob follows alice, alice creates a post — bob's feed should
    // show it. After mute, bob's feed should NOT show it.
    let alicePost: { id: string };

    beforeAll(async () => {
      // bob follows alice (need to undo the follow from before)
      // Bob already follows alice from the unblock test — keep it.
      alicePost = await createPost(aliceToken, 'mute test post');
    });

    it('shows alice\'s post in bob\'s feed before mute', async () => {
      const res = await gql(
        `query Feed {
          feed(limit: 20) { items { id caption author { username } } }
        }`,
        undefined,
        bobToken,
      );
      const captions = res.body.data.feed.items.map((p: any) => p.caption);
      expect(captions).toContain('mute test post');
    });

    it('lets bob mute alice for posts only', async () => {
      const res = await gql(
        `mutation MuteUser($userId: ID!, $mutePosts: Boolean, $muteStories: Boolean) {
          muteUser(userId: $userId, mutePosts: $mutePosts, muteStories: $muteStories) {
            id muterId mutedId mutePosts muteStories
          }
        }`,
        { userId: aliceId, mutePosts: true, muteStories: false },
        bobToken,
      );
      expect(res.body.data.muteUser.mutePosts).toBe(true);
      expect(res.body.data.muteUser.muteStories).toBe(false);
    });

    it('hides alice\'s posts from bob\'s feed after mute', async () => {
      const res = await gql(
        `query Feed {
          feed(limit: 20) { items { id caption author { username } } }
        }`,
        undefined,
        bobToken,
      );
      const captions = res.body.data.feed.items.map((p: any) => p.caption);
      expect(captions).not.toContain('mute test post');
    });

    it('isMuted returns true', async () => {
      const res = await gql(
        `query IsMuted($userId: ID!) {
          isMuted(userId: $userId)
        }`,
        { userId: aliceId },
        bobToken,
      );
      expect(res.body.data.isMuted).toBe(true);
    });

    it('myMutes lists muted users', async () => {
      const res = await gql(
        `query MyMutes {
          myMutes { id muted { id username } mutePosts muteStories }
        }`,
        undefined,
        bobToken,
      );
      expect(res.body.data.myMutes).toHaveLength(1);
      expect(res.body.data.myMutes[0].muted.username).toBe('alice');
      expect(res.body.data.myMutes[0].mutePosts).toBe(true);
      expect(res.body.data.myMutes[0].muteStories).toBe(false);
    });

    it('lets bob unmute alice — feed shows the post again', async () => {
      await gql(
        `mutation UnmuteUser($userId: ID!) {
          unmuteUser(userId: $userId)
        }`,
        { userId: aliceId },
        bobToken,
      );
      const res = await gql(
        `query Feed {
          feed(limit: 20) { items { id caption } }
        }`,
        undefined,
        bobToken,
      );
      const captions = res.body.data.feed.items.map((p: any) => p.caption);
      expect(captions).toContain('mute test post');
    });

    it('rejects muting self', async () => {
      const res = await gql(
        `mutation MuteUser($userId: ID!, $mutePosts: Boolean, $muteStories: Boolean) {
          muteUser(userId: $userId, mutePosts: $mutePosts, muteStories: $muteStories) { id }
        }`,
        { userId: bobId, mutePosts: true, muteStories: true },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('rejects unauthenticated mute attempts', async () => {
      const res = await gql(
        `mutation MuteUser($userId: ID!, $mutePosts: Boolean, $muteStories: Boolean) {
          muteUser(userId: $userId, mutePosts: $mutePosts, muteStories: $muteStories) { id }
        }`,
        { userId: aliceId, mutePosts: true, muteStories: true },
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // SUGGESTIONS
  // ===========================================================================
  describe('Suggestions', () => {
    // Setup: alice follows carol. carol follows dave. dave should be suggested
    // to alice with mutual count = 1.
    beforeAll(async () => {
      await gql(
        `mutation FollowUser($userId: String!) {
          followUser(userId: $userId)
        }`,
        { userId: carolId },
        aliceToken,
      );
      await gql(
        `mutation FollowUser($userId: String!) {
          followUser(userId: $userId)
        }`,
        { userId: daveId },
        carolToken,
      );
    });

    it('returns suggestions ranked by mutual friends', async () => {
      const res = await gql(
        `query SuggestUsers($limit: Int) {
          suggestUsers(limit: $limit) {
            items { user { id username } mutualCount reason }
            total
          }
        }`,
        { limit: 10 },
        aliceToken,
      );
      expect(res.body.data.suggestUsers.total).toBeGreaterThan(0);
      // dave should appear (carol is mutual)
      const daveSuggestion = res.body.data.suggestUsers.items.find(
        (s: any) => s.user.username === 'dave',
      );
      expect(daveSuggestion).toBeDefined();
      expect(daveSuggestion.mutualCount).toBe(1);
    });

    it('excludes users already followed', async () => {
      const res = await gql(
        `query SuggestUsers($limit: Int) {
          suggestUsers(limit: $limit) {
            items { user { username } }
          }
        }`,
        { limit: 20 },
        aliceToken,
      );
      const usernames = res.body.data.suggestUsers.items.map((s: any) => s.user.username);
      expect(usernames).not.toContain('carol'); // alice follows carol
    });

    it('excludes self', async () => {
      const res = await gql(
        `query SuggestUsers($limit: Int) {
          suggestUsers(limit: $limit) {
            items { user { username } }
          }
        }`,
        { limit: 20 },
        aliceToken,
      );
      const usernames = res.body.data.suggestUsers.items.map((s: any) => s.user.username);
      expect(usernames).not.toContain('alice');
    });

    it('rejects unauthenticated access', async () => {
      const res = await gql(
        `query SuggestUsers($limit: Int) {
          suggestUsers(limit: $limit) { items { user { id } } }
        }`,
        { limit: 10 },
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // COLLECTIONS
  // ===========================================================================
  describe('Collections', () => {
    let collectionId: string;
    let postId: { id: string };

    beforeAll(async () => {
      postId = await createPost(aliceToken, 'collection test post');
    });

    it('creates a collection', async () => {
      const res = await gql(
        `mutation CreateCollection($name: String!, $description: String) {
          createCollection(name: $name, description: $description) {
            id name description
          }
        }`,
        { name: 'Travel', description: 'Trips I want to take' },
        aliceToken,
      );
      expect(res.body.data.createCollection.name).toBe('Travel');
      expect(res.body.data.createCollection.description).toBe('Trips I want to take');
      collectionId = res.body.data.createCollection.id;
    });

    it('lists collections alphabetically', async () => {
      // Add a second collection to test ordering
      await gql(
        `mutation CreateCollection($name: String!) {
          createCollection(name: $name) { id }
        }`,
        { name: 'Recipes' },
        aliceToken,
      );
      const res = await gql(
        `query MyCollections {
          myCollections { items { name } total }
        }`,
        undefined,
        aliceToken,
      );
      expect(res.body.data.myCollections.total).toBeGreaterThanOrEqual(2);
      const names = res.body.data.myCollections.items.map((c: any) => c.name);
      // Alphabetical
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('rejects duplicate name per user', async () => {
      const res = await gql(
        `mutation CreateCollection($name: String!) {
          createCollection(name: $name) { id }
        }`,
        { name: 'Travel' },
        aliceToken,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('adds a post to a collection', async () => {
      const res = await gql(
        `mutation AddToCollection($collectionId: ID!, $postId: ID!) {
          addToCollection(collectionId: $collectionId, postId: $postId) {
            id collectionId postId
          }
        }`,
        { collectionId, postId: postId.id },
        aliceToken,
      );
      expect(res.body.data.addToCollection.collectionId).toBe(collectionId);
      expect(res.body.data.addToCollection.postId).toBe(postId.id);
    });

    it('is idempotent — re-adding the same post does not duplicate', async () => {
      const first = await gql(
        `mutation AddToCollection($collectionId: ID!, $postId: ID!) {
          addToCollection(collectionId: $collectionId, postId: $postId) { id }
        }`,
        { collectionId, postId: postId.id },
        aliceToken,
      );
      const second = await gql(
        `mutation AddToCollection($collectionId: ID!, $postId: ID!) {
          addToCollection(collectionId: $collectionId, postId: $postId) { id }
        }`,
        { collectionId, postId: postId.id },
        aliceToken,
      );
      expect(second.body.data.addToCollection.id).toBe(first.body.data.addToCollection.id);
    });

    it('retrieves a collection with its items preloaded', async () => {
      const res = await gql(
        `query Collection($id: ID!) {
          collection(id: $id) {
            id name
            items { id postId post { id caption } }
          }
        }`,
        { id: collectionId },
        aliceToken,
      );
      expect(res.body.data.collection.items).toHaveLength(1);
      expect(res.body.data.collection.items[0].post.caption).toBe('collection test post');
    });

    it('forbids other users from reading a collection', async () => {
      const res = await gql(
        `query Collection($id: ID!) {
          collection(id: $id) { id }
        }`,
        { id: collectionId },
        bobToken,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('updates a collection name', async () => {
      const res = await gql(
        `mutation UpdateCollection($id: ID!, $name: String) {
          updateCollection(id: $id, name: $name) { id name }
        }`,
        { id: collectionId, name: 'Wanderlust' },
        aliceToken,
      );
      expect(res.body.data.updateCollection.name).toBe('Wanderlust');
    });

    it('removes a post from a collection', async () => {
      const res = await gql(
        `mutation RemoveFromCollection($collectionId: ID!, $postId: ID!) {
          removeFromCollection(collectionId: $collectionId, postId: $postId)
        }`,
        { collectionId, postId: postId.id },
        aliceToken,
      );
      expect(res.body.data.removeFromCollection).toBe(true);
      // Verify it's gone
      const getRes = await gql(
        `query Collection($id: ID!) {
          collection(id: $id) { items { id } }
        }`,
        { id: collectionId },
        aliceToken,
      );
      expect(getRes.body.data.collection.items).toHaveLength(0);
    });

    it('deletes a collection', async () => {
      const res = await gql(
        `mutation DeleteCollection($id: ID!) {
          deleteCollection(id: $id)
        }`,
        { id: collectionId },
        aliceToken,
      );
      expect(res.body.data.deleteCollection).toBe(true);
      // Verify it's gone — fetching should throw NotFound
      const getRes = await gql(
        `query Collection($id: ID!) {
          collection(id: $id) { id }
        }`,
        { id: collectionId },
        aliceToken,
      );
      expect(getRes.body.errors).toBeDefined();
    });

    it('rejects unauthenticated access to myCollections', async () => {
      const res = await gql(
        `query MyCollections {
          myCollections { items { id } }
        }`,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // CROSS-MODULE INTEGRATION
  // ===========================================================================
  describe('Cross-module integration', () => {
    it('block + unblock + follow + DM round-trip', async () => {
      // alice blocks carol, then can't DM her
      await gql(
        `mutation BlockUser($userId: ID!) {
          blockUser(userId: $userId) { id }
        }`,
        { userId: carolId },
        aliceToken,
      );

      const blockedSend = await gql(
        `mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) { id }
        }`,
        { input: { recipientId: carolId, text: 'blocked DM' } },
        aliceToken,
      );
      expect(blockedSend.body.errors).toBeDefined();

      // alice unblocks carol
      await gql(
        `mutation UnblockUser($userId: ID!) {
          unblockUser(userId: $userId)
        }`,
        { userId: carolId },
        aliceToken,
      );

      // Now DM should work
      const okSend = await gql(
        `mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) { id text }
        }`,
        { input: { recipientId: carolId, text: 'unblocked DM' } },
        aliceToken,
      );
      expect(okSend.body.errors).toBeUndefined();
      expect(okSend.body.data.sendMessage.text).toBe('unblocked DM');
    });

    it('all Phase 5 modules coexist without interference', async () => {
      // Smoke test: query all four module entrypoints in sequence.
      const blocks = await gql(`query { myBlocks { id } }`, undefined, aliceToken);
      expect(blocks.body.errors).toBeUndefined();

      const mutes = await gql(`query { myMutes { id } }`, undefined, aliceToken);
      expect(mutes.body.errors).toBeUndefined();

      const suggestions = await gql(`query { suggestUsers(limit: 5) { total } }`, undefined, aliceToken);
      expect(suggestions.body.errors).toBeUndefined();

      const collections = await gql(`query { myCollections { total } }`, undefined, aliceToken);
      expect(collections.body.errors).toBeUndefined();
    });
  });
});
