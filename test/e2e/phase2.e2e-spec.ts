import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * End-to-end tests for Phase 2 features:
 *  - Stories (create, view, react, feed visibility, close_friends gating)
 *  - Highlights (create, create-from-stories, update, delete, public read)
 *
 * Boots the full AppModule against an in-memory SQLite DB and exercises the
 * GraphQL surface via supertest.
 *
 * Note on enums: NestJS `registerEnumType` exposes the TS enum NAMES as the
 * GraphQL enum values (Image/Video, Public/CloseFriends), NOT the underlying
 * string values. So in GraphQL queries we use `IMAGE`-style UPPER_CASE only
 * if we explicitly configure valuesConfig — which we don't here.
 */
describe('Phase 2 E2E — Stories + Highlights', () => {
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

  // ---------------------------------------------------------------------------
  // Setup: register three users + set up follow graph
  // ---------------------------------------------------------------------------

  it('registers alice, bob, carol', async () => {
    const a = await register('alice', 'alice@example.com');
    const b = await register('bob', 'bob@example.com');
    const c = await register('carol', 'carol@example.com');

    aliceId = a.id;
    aliceToken = a.token;
    bobId = b.id;
    bobToken = b.token;
    carolId = c.id;
    carolToken = c.token;

    expect(aliceId).toBeTruthy();
    expect(bobId).toBeTruthy();
    expect(carolId).toBeTruthy();
  });

  it('sets up follow graph: bob+carol follow alice, alice follows bob (prereq for close friends)', async () => {
    // bob follows alice → bob sees alice's stories
    let res = await gql(
      `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
      { userId: aliceId },
      bobToken,
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.followUser).toBe(true);

    // carol follows alice → carol sees alice's stories
    res = await gql(
      `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
      { userId: aliceId },
      carolToken,
    );
    expect(res.body.errors).toBeUndefined();

    // alice follows bob (prerequisite for marking close)
    res = await gql(
      `mutation Follow($userId: String!) { followUser(userId: $userId) }`,
      { userId: bobId },
      aliceToken,
    );
    expect(res.body.errors).toBeUndefined();

    // alice marks bob as close friend
    res = await gql(
      `mutation ToggleClose($userId: String!, $isClose: Boolean!) {
        toggleCloseFriend(userId: $userId, isClose: $isClose)
      }`,
      { userId: bobId, isClose: true },
      aliceToken,
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.toggleCloseFriend).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Stories
  // ---------------------------------------------------------------------------

  describe('Stories', () => {
    let publicStoryId: string;
    let closeFriendsStoryId: string;

    it('alice creates a public story', async () => {
      const res = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) {
            id mediaUrl mediaType visibility
            isExpired viewsCount isViewedByMe
            author { id username }
          }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/public.jpg',
            mediaType: 'Image',
            caption: 'Public story',
            visibility: 'Public',
          },
        },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createStory.visibility).toBe('Public');
      expect(res.body.data.createStory.mediaType).toBe('Image');
      expect(res.body.data.createStory.isExpired).toBe(false);
      expect(res.body.data.createStory.viewsCount).toBe(0);
      expect(res.body.data.createStory.isViewedByMe).toBe(false);
      publicStoryId = res.body.data.createStory.id;
    });

    it('alice creates a close_friends story', async () => {
      const res = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) {
            id visibility author { id }
          }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/close.jpg',
            mediaType: 'Image',
            visibility: 'CloseFriends',
          },
        },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createStory.visibility).toBe('CloseFriends');
      closeFriendsStoryId = res.body.data.createStory.id;
    });

    it('bob (close friend) sees BOTH stories in his feed', async () => {
      const res = await gql(
        `query StoriesFeed {
          storiesFeed {
            userId user { username }
            storiesCount hasUnviewed
            stories { id visibility }
          }
        }`,
        undefined,
        bobToken,
      );
      expect(res.body.errors).toBeUndefined();
      const aliceGroup = res.body.data.storiesFeed.find(
        (g: any) => g.userId === aliceId,
      );
      expect(aliceGroup).toBeTruthy();
      const storyIds = aliceGroup.stories.map((s: any) => s.id);
      expect(storyIds).toContain(publicStoryId);
      expect(storyIds).toContain(closeFriendsStoryId);
    });

    it('carol (NOT close friend) sees ONLY the public story', async () => {
      const res = await gql(
        `query StoriesFeed {
          storiesFeed {
            userId stories { id visibility }
          }
        }`,
        undefined,
        carolToken,
      );
      expect(res.body.errors).toBeUndefined();
      const aliceGroup = res.body.data.storiesFeed.find(
        (g: any) => g.userId === aliceId,
      );
      expect(aliceGroup).toBeTruthy();
      const storyIds = aliceGroup.stories.map((s: any) => s.id);
      expect(storyIds).toContain(publicStoryId);
      expect(storyIds).not.toContain(closeFriendsStoryId);
    });

    it('bob views the public story — viewCount increments, isViewedByMe true', async () => {
      // View once
      let res = await gql(
        `mutation ViewStory($storyId: ID!) {
          viewStory(storyId: $storyId) { id viewsCount isViewedByMe }
        }`,
        { storyId: publicStoryId },
        bobToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.viewStory.viewsCount).toBe(1);
      expect(res.body.data.viewStory.isViewedByMe).toBe(true);

      // View again — should be idempotent
      res = await gql(
        `mutation ViewStory($storyId: ID!) {
          viewStory(storyId: $storyId) { id viewsCount isViewedByMe }
        }`,
        { storyId: publicStoryId },
        bobToken,
      );
      expect(res.body.data.viewStory.viewsCount).toBe(1);
    });

    it('carol cannot view the close_friends story (returns NotFound)', async () => {
      const res = await gql(
        `mutation ViewStory($storyId: ID!) {
          viewStory(storyId: $storyId) { id }
        }`,
        { storyId: closeFriendsStoryId },
        carolToken,
      );
      expect(res.body.errors).toBeTruthy();
      expect(res.body.data?.viewStory ?? null).toBeNull();
    });

    it('bob can react to alice\u2019s close_friends story (he is allowed to view it)', async () => {
      const res = await gql(
        `mutation ReactToStory($storyId: ID!, $emoji: String!) {
          reactToStory(storyId: $storyId, emoji: $emoji) { id viewsCount isViewedByMe }
        }`,
        { storyId: closeFriendsStoryId, emoji: '🔥' },
        bobToken,
      );
      expect(res.body.errors).toBeUndefined();
      // Reacting also auto-views the story
      expect(res.body.data.reactToStory.isViewedByMe).toBe(true);
    });

    it('alice can see who viewed her public story', async () => {
      const res = await gql(
        `query StoryViewers($storyId: ID!) {
          storyViewers(storyId: $storyId) {
            id user { id username }
            viewedAt
          }
        }`,
        { storyId: publicStoryId },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.storyViewers.length).toBeGreaterThanOrEqual(1);
      const viewerNames = res.body.data.storyViewers.map((v: any) => v.user.username);
      expect(viewerNames).toContain('bob');
    });

    it('bob cannot see storyViewers of alice\u2019s story (author only)', async () => {
      const res = await gql(
        `query StoryViewers($storyId: ID!) {
          storyViewers(storyId: $storyId) { id }
        }`,
        { storyId: publicStoryId },
        bobToken,
      );
      expect(res.body.errors).toBeTruthy();
    });

    it('alice can delete her own story', async () => {
      const temp = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) { id }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/temp.jpg',
            mediaType: 'Image',
          },
        },
        aliceToken,
      );
      const tempId = temp.body.data.createStory.id;

      const res = await gql(
        `mutation DeleteStory($id: ID!) { deleteStory(id: $id) }`,
        { id: tempId },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteStory).toBe(true);
    });

    it('bob cannot delete alice\u2019s story (forbidden)', async () => {
      const res = await gql(
        `mutation DeleteStory($id: ID!) { deleteStory(id: $id) }`,
        { id: publicStoryId },
        bobToken,
      );
      expect(res.body.errors).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Highlights
  // ---------------------------------------------------------------------------

  describe('Highlights', () => {
    let highlightId: string;

    it('alice creates a highlight with multiple items', async () => {
      const res = await gql(
        `mutation CreateHighlight($input: CreateHighlightInput!) {
          createHighlight(input: $input) {
            id title coverUrl
            items { id mediaUrl mediaType caption order }
          }
        }`,
        {
          input: {
            title: 'My Trip',
            coverUrl: 'https://cdn.pixora.app/cover.jpg',
            items: [
              { mediaUrl: 'https://cdn.pixora.app/1.jpg', mediaType: 'Image', caption: 'Day 1' },
              { mediaUrl: 'https://cdn.pixora.app/2.mp4', mediaType: 'Video' },
              { mediaUrl: 'https://cdn.pixora.app/3.jpg', mediaType: 'Image', caption: 'Day 3' },
            ],
          },
        },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createHighlight.title).toBe('My Trip');
      expect(res.body.data.createHighlight.items).toHaveLength(3);
      // Items should be ordered
      expect(res.body.data.createHighlight.items[0].order).toBe(0);
      expect(res.body.data.createHighlight.items[2].order).toBe(2);
      highlightId = res.body.data.createHighlight.id;
    });

    it('rejects highlight with no items', async () => {
      const res = await gql(
        `mutation CreateHighlight($input: CreateHighlightInput!) {
          createHighlight(input: $input) { id }
        }`,
        {
          input: {
            title: 'Empty',
            items: [],
          },
        },
        aliceToken,
      );
      expect(res.body.errors).toBeTruthy();
    });

    it('anyone (including bob) can fetch a highlight by id', async () => {
      const res = await gql(
        `query Highlight($id: ID!) {
          highlight(id: $id) {
            id title
            items { mediaUrl mediaType caption }
          }
        }`,
        { id: highlightId },
        bobToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.highlight.id).toBe(highlightId);
      expect(res.body.data.highlight.items).toHaveLength(3);
    });

    it('anyone can list alice\u2019s highlights', async () => {
      const res = await gql(
        `query HighlightsByUser($userId: ID!) {
          highlightsByUser(userId: $userId) {
            id title items { mediaUrl }
          }
        }`,
        { userId: aliceId },
        carolToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.highlightsByUser.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.highlightsByUser.find(
        (h: any) => h.id === highlightId,
      );
      expect(found).toBeTruthy();
    });

    it('alice can update her highlight title', async () => {
      const res = await gql(
        `mutation UpdateHighlight($id: ID!, $input: UpdateHighlightInput!) {
          updateHighlight(id: $id, input: $input) { id title }
        }`,
        { id: highlightId, input: { title: 'Renamed Trip' } },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateHighlight.title).toBe('Renamed Trip');
    });

    it('bob cannot update alice\u2019s highlight (forbidden)', async () => {
      const res = await gql(
        `mutation UpdateHighlight($id: ID!, $input: UpdateHighlightInput!) {
          updateHighlight(id: $id, input: $input) { id }
        }`,
        { id: highlightId, input: { title: 'Hacked' } },
        bobToken,
      );
      expect(res.body.errors).toBeTruthy();
    });

    it('alice can build a highlight from her own stories (media copied)', async () => {
      // First create two stories
      const s1 = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) { id }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/from-story-1.jpg',
            mediaType: 'Image',
            caption: 'Story caption 1',
          },
        },
        aliceToken,
      );
      const s2 = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) { id }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/from-story-2.mp4',
            mediaType: 'Video',
          },
        },
        aliceToken,
      );
      const s1Id = s1.body.data.createStory.id;
      const s2Id = s2.body.data.createStory.id;

      // Now build a highlight from these stories
      const res = await gql(
        `mutation CreateHighlightFromStories($title: String!, $storyIds: [ID!]!, $coverUrl: String) {
          createHighlightFromStories(title: $title, storyIds: $storyIds, coverUrl: $coverUrl) {
            id title
            items { mediaUrl mediaType caption order }
          }
        }`,
        { title: 'From Stories', storyIds: [s2Id, s1Id] },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createHighlightFromStories.items).toHaveLength(2);
      // Order should match the input order ([s2, s1])
      expect(res.body.data.createHighlightFromStories.items[0].mediaUrl).toBe(
        'https://cdn.pixora.app/from-story-2.mp4',
      );
      expect(res.body.data.createHighlightFromStories.items[0].mediaType).toBe('Video');
      expect(res.body.data.createHighlightFromStories.items[1].mediaUrl).toBe(
        'https://cdn.pixora.app/from-story-1.jpg',
      );
      expect(res.body.data.createHighlightFromStories.items[1].caption).toBe(
        'Story caption 1',
      );
    });

    it('alice cannot build a highlight from bob\u2019s stories (NotFound)', async () => {
      const bobStory = await gql(
        `mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) { id }
        }`,
        {
          input: {
            mediaUrl: 'https://cdn.pixora.app/bob-story.jpg',
            mediaType: 'Image',
          },
        },
        bobToken,
      );
      const bobStoryId = bobStory.body.data.createStory.id;

      const res = await gql(
        `mutation CreateHighlightFromStories($title: String!, $storyIds: [ID!]!, $coverUrl: String) {
          createHighlightFromStories(title: $title, storyIds: $storyIds, coverUrl: $coverUrl) { id }
        }`,
        { title: 'Stolen', storyIds: [bobStoryId] },
        aliceToken,
      );
      expect(res.body.errors).toBeTruthy();
    });

    it('alice can delete her highlight', async () => {
      const temp = await gql(
        `mutation CreateHighlight($input: CreateHighlightInput!) {
          createHighlight(input: $input) { id }
        }`,
        {
          input: {
            title: 'To Delete',
            items: [{ mediaUrl: 'https://cdn.pixora.app/x.jpg', mediaType: 'Image' }],
          },
        },
        aliceToken,
      );
      const tempId = temp.body.data.createHighlight.id;

      const res = await gql(
        `mutation DeleteHighlight($id: ID!) { deleteHighlight(id: $id) }`,
        { id: tempId },
        aliceToken,
      );
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteHighlight).toBe(true);
    });

    it('bob cannot delete alice\u2019s highlight (forbidden)', async () => {
      const res = await gql(
        `mutation DeleteHighlight($id: ID!) { deleteHighlight(id: $id) }`,
        { id: highlightId },
        bobToken,
      );
      expect(res.body.errors).toBeTruthy();
    });
  });
});
