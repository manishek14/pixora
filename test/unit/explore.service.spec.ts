import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExploreService } from '@/modules/explore/explore.service';
import { FollowsService } from '@/modules/follows/follows.service';
import { PostsService } from '@/modules/posts/posts.service';
import { ReelsService } from '@/modules/reels/reels.service';
import { UserEntity } from '@/modules/users/user.entity';
import { PostEntity } from '@/modules/posts/post.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity } from '@/modules/highlights/entities/highlight-item.entity';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { JwtModule } from '@nestjs/jwt';

/**
 * Unit + integration tests for ExploreService.
 *
 * Covers:
 *  - exploreTrending (mixed posts + reels, ranked by engagement * recency)
 *  - trendingReels (top reels by views/likes, 7-day window)
 *  - trendingPosts (top posts by likes, 7-day window)
 *  - trendingHashtags (top hashtags from recent posts + reels)
 *  - suggestedUsers (not-followed users ranked by mutual followers)
 */
describe('ExploreService', () => {
  let service: ExploreService;
  let postsService: PostsService;
  let reelsService: ReelsService;
  let followsService: FollowsService;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;
  let moduleRef: TestingModule;

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
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          PostEntity,
          UserEntity,
          FollowEntity,
          LikeEntity,
          CommentEntity,
          ReelViewEntity,
        ]),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
      ],
      providers: [ExploreService, FollowsService, PostsService, ReelsService],
    }).compile();

    service = moduleRef.get(ExploreService);
    postsService = moduleRef.get(PostsService);
    reelsService = moduleRef.get(ReelsService);
    followsService = moduleRef.get(FollowsService);
    postRepo = moduleRef.get(getRepositoryToken(PostEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await postRepo.clear();
    await userRepo.clear();
    // Clear follows via the repo through the service — quick & dirty:
    const followRepo = moduleRef.get(getRepositoryToken(FollowEntity)) as Repository<FollowEntity>;
    await followRepo.clear();
  });

  describe('getExploreFeed', () => {
    it('returns mixed posts + reels ranked by engagement score', async () => {
      const author = await newUser('alice');
      const lowEngagement = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/low.jpg'],
        caption: 'low engagement post',
      } as any);
      const highEngagement = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/high.jpg'],
        caption: 'high engagement post',
      } as any);
      // bump highEngagement
      await postRepo.update(highEngagement.id, {
        likesCount: 100,
        commentsCount: 50,
      });
      await postRepo.update(lowEngagement.id, { likesCount: 1 });

      const result = await service.getExploreFeed(10, 0);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items[0].id).toBe(highEngagement.id);
      expect(result.items[1].id).toBe(lowEngagement.id);
    });

    it('excludes archived posts', async () => {
      const author = await newUser('alice');
      const p1 = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p1.jpg'],
        caption: 'visible',
      } as any);
      const p2 = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p2.jpg'],
        caption: 'archived',
      } as any);
      await postsService.archive(p2.id, author.id, true);

      const result = await service.getExploreFeed(10, 0);
      expect(result.items.find((p) => p.id === p2.id)).toBeUndefined();
      expect(result.items.find((p) => p.id === p1.id)).toBeDefined();
    });

    it('returns empty when no posts exist', async () => {
      const result = await service.getExploreFeed(10, 0);
      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('respects limit + offset for pagination', async () => {
      const author = await newUser('alice');
      for (let i = 0; i < 5; i++) {
        await postsService.create(author.id, {
          mediaUrls: [`https://cdn.test/p${i}.jpg`],
          caption: `post ${i}`,
        } as any);
      }
      const page1 = await service.getExploreFeed(2, 0);
      const page2 = await service.getExploreFeed(2, 2);
      expect(page1.items).toHaveLength(2);
      expect(page1.hasMore).toBe(true);
      expect(page2.items).toHaveLength(2);
      expect(page2.hasMore).toBe(true);
    });
  });

  describe('getTrendingReels', () => {
    it('returns only reels, sorted by views then likes', async () => {
      const author = await newUser('alice');
      const r1 = await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/r1.mp4',
      });
      const r2 = await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/r2.mp4',
      });
      // also create a regular post (should NOT show up)
      await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p.jpg'],
        caption: 'regular post',
      } as any);

      await postRepo.update(r1.id, { viewsCount: 100, likesCount: 10 });
      await postRepo.update(r2.id, { viewsCount: 500, likesCount: 5 });

      const reels = await service.getTrendingReels(10);
      expect(reels).toHaveLength(2);
      expect(reels[0].id).toBe(r2.id); // higher views
      expect(reels[1].id).toBe(r1.id);
    });

    it('excludes reels older than 7 days', async () => {
      const author = await newUser('alice');
      const oldReel = await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/old.mp4',
      });
      // Manually set createdAt to 10 days ago
      await postRepo.update(oldReel.id, {
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      });
      const freshReel = await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/fresh.mp4',
      });
      const reels = await service.getTrendingReels(10);
      expect(reels).toHaveLength(1);
      expect(reels[0].id).toBe(freshReel.id);
    });
  });

  describe('getTrendingPosts', () => {
    it('returns only non-reel posts sorted by likes', async () => {
      const author = await newUser('alice');
      const p1 = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p1.jpg'],
        caption: 'p1',
      } as any);
      const p2 = await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p2.jpg'],
        caption: 'p2',
      } as any);
      // also create a reel (should NOT show up)
      await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });

      await postRepo.update(p1.id, { likesCount: 5 });
      await postRepo.update(p2.id, { likesCount: 100 });

      const posts = await service.getTrendingPosts(10);
      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe(p2.id); // more likes
      expect(posts[1].id).toBe(p1.id);
    });
  });

  describe('getTrendingHashtags', () => {
    it('counts hashtags across posts + reels', async () => {
      const author = await newUser('alice');
      await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p1.jpg'],
        caption: '#cats are the best',
      } as any);
      await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p2.jpg'],
        caption: 'more #cats content',
      } as any);
      await reelsService.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
        caption: '#cats #dogs',
      });

      const trends = await service.getTrendingHashtags(10);
      const cats = trends.find((t) => t.tag === 'cats');
      expect(cats).toBeDefined();
      expect(cats!.postsCount).toBe(2);
      expect(cats!.reelsCount).toBe(1);
      expect(cats!.total).toBe(3);

      const dogs = trends.find((t) => t.tag === 'dogs');
      expect(dogs).toBeDefined();
      expect(dogs!.total).toBe(1);
    });

    it('returns hashtags sorted by total count desc', async () => {
      const author = await newUser('alice');
      // popular: 5 posts
      for (let i = 0; i < 5; i++) {
        await postsService.create(author.id, {
          mediaUrls: [`https://cdn.test/p${i}.jpg`],
          caption: '#popular',
        } as any);
      }
      // less popular: 1 post
      await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/lonely.jpg'],
        caption: '#lonely',
      } as any);

      const trends = await service.getTrendingHashtags(10);
      expect(trends[0].tag).toBe('popular');
      expect(trends[0].total).toBe(5);
      expect(trends[1].tag).toBe('lonely');
      expect(trends[1].total).toBe(1);
    });

    it('respects the limit argument', async () => {
      const author = await newUser('alice');
      await postsService.create(author.id, {
        mediaUrls: ['https://cdn.test/p1.jpg'],
        caption: '#a #b #c #d #e',
      } as any);
      const trends = await service.getTrendingHashtags(3);
      expect(trends).toHaveLength(3);
    });

    it('returns empty when no posts have hashtags', async () => {
      const trends = await service.getTrendingHashtags(10);
      expect(trends).toEqual([]);
    });
  });

  describe('getSuggestedUsers', () => {
    it('excludes users the current user already follows + self', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      await followsService.follow(alice.id, bob.id);

      const suggestions = await service.getSuggestedUsers(alice.id, 10);
      const ids = suggestions.map((s) => s.user.id);
      expect(ids).not.toContain(alice.id);
      expect(ids).not.toContain(bob.id); // already followed
      expect(ids).toContain(carol.id);
    });

    it('ranks by mutual followers desc, then postsCount desc', async () => {
      // alice (current user) is followed by dave and eve (mutuals candidates)
      // bob has 2 mutuals with alice (dave + eve both follow bob)
      // carol has 1 mutual with alice (dave follows carol)
      // carol has more posts than bob, but bob should rank higher due to mutuals
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const dave = await newUser('dave');
      const eve = await newUser('eve');

      // dave + eve follow alice (so they are alice's followers = mutual candidates)
      await followsService.follow(dave.id, alice.id);
      await followsService.follow(eve.id, alice.id);
      // dave + eve follow bob → bob has 2 mutuals with alice
      await followsService.follow(dave.id, bob.id);
      await followsService.follow(eve.id, bob.id);
      // dave follows carol → carol has 1 mutual with alice
      await followsService.follow(dave.id, carol.id);

      // give carol MORE posts than bob to test mutual-priority ordering
      for (let i = 0; i < 5; i++) {
        await postsService.create(carol.id, {
          mediaUrls: [`https://cdn.test/carol${i}.jpg`],
          caption: `carol post ${i}`,
        } as any);
      }
      await postsService.create(bob.id, {
        mediaUrls: ['https://cdn.test/bob.jpg'],
        caption: 'bob post',
      } as any);

      const suggestions = await service.getSuggestedUsers(alice.id, 10);
      const bobIdx = suggestions.findIndex((s) => s.user.id === bob.id);
      const carolIdx = suggestions.findIndex((s) => s.user.id === carol.id);
      expect(bobIdx).toBeGreaterThanOrEqual(0);
      expect(carolIdx).toBeGreaterThanOrEqual(0);
      // bob should rank higher (more mutuals)
      expect(bobIdx).toBeLessThan(carolIdx);
    });

    it('respects the limit argument', async () => {
      const alice = await newUser('alice');
      for (let i = 0; i < 5; i++) {
        await newUser(`user${i}`);
      }
      const suggestions = await service.getSuggestedUsers(alice.id, 2);
      expect(suggestions).toHaveLength(2);
    });

    it('returns empty when no candidates exist', async () => {
      const alice = await newUser('alice');
      const suggestions = await service.getSuggestedUsers(alice.id, 10);
      expect(suggestions).toEqual([]);
    });
  });
});
