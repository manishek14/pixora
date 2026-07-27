import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchService } from '@/modules/search/search.service';
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
import { PostsService } from '@/modules/posts/posts.service';

describe('SearchService', () => {
  let service: SearchService;
  let userRepo: Repository<UserEntity>;
  let postRepo: Repository<PostEntity>;
  let postsService: PostsService;
  let moduleRef: any;

  const newUser = async (username: string, fullName?: string) => {
    const user = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
      fullName,
    });
    return userRepo.save(user);
  };

  const newPost = async (authorId: string, caption: string, hashtags: string[] = []) => {
    return postsService.create(authorId, {
      mediaUrls: ['https://cdn.test/p.jpg'],
      caption,
      hashtags,
    } as any);
  };

  const newReel = async (authorId: string, caption: string, hashtags: string[] = []) => {
    const reel = postRepo.create({
      authorId,
      caption,
      mediaUrls: ['https://cdn.test/r.mp4'],
      hashtags,
      mentions: [],
      isReel: true,
      videoUrl: 'https://cdn.test/r.mp4',
      durationSeconds: 15,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      sharesCount: 0,
      archived: false,
    });
    return postRepo.save(reel);
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
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([UserEntity, PostEntity]),
      ],
      providers: [SearchService, PostsService],
    }).compile();

    service = moduleRef.get(SearchService);
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    postRepo = moduleRef.get(getRepositoryToken(PostEntity));
    postsService = moduleRef.get(PostsService);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await postRepo.clear();
    await userRepo.clear();
  });

  // ------------------------------------------------------------------
  // searchUsers
  // ------------------------------------------------------------------
  describe('searchUsers', () => {
    it('matches by username (case-insensitive, contains)', async () => {
      await newUser('alice', 'Alice Wonderland');
      await newUser('bob', 'Robert');
      const res = await service.searchUsers('ALI');
      expect(res).toHaveLength(1);
      expect(res[0].username).toBe('alice');
    });

    it('matches by fullName', async () => {
      await newUser('u1', 'Alice Wonderland');
      await newUser('u2', 'Robert Downey');
      const res = await service.searchUsers('wonder');
      expect(res).toHaveLength(1);
      expect(res[0].username).toBe('u1');
    });

    it('returns empty array for empty query', async () => {
      await newUser('foo');
      const res = await service.searchUsers('');
      expect(res).toHaveLength(0);
    });

    it('respects the limit argument', async () => {
      for (let i = 0; i < 5; i++) {
        await newUser(`alice${i}`, `Alice ${i}`);
      }
      const res = await service.searchUsers('alice', 2);
      expect(res).toHaveLength(2);
    });

    it('strips leading @ from query', async () => {
      await newUser('charlie');
      const res = await service.searchUsers('@charlie');
      expect(res).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------
  // searchPosts
  // ------------------------------------------------------------------
  describe('searchPosts', () => {
    it('matches by caption (case-insensitive)', async () => {
      const a = await newUser('a1');
      await newPost(a.id, 'Sunset over the ocean');
      await newPost(a.id, 'City skyline at night');
      const res = await service.searchPosts('SUNSET');
      expect(res).toHaveLength(1);
      expect(res[0].caption).toContain('Sunset');
    });

    it('excludes reels (reels go through searchReels instead)', async () => {
      const a = await newUser('a2');
      await newPost(a.id, 'sunset photo post');
      await newReel(a.id, 'sunset reel clip');
      const res = await service.searchPosts('sunset');
      expect(res).toHaveLength(1);
      expect(res[0].isReel).toBe(false);
    });

    it('excludes archived posts', async () => {
      const a = await newUser('a3');
      const p = await newPost(a.id, 'archived sunset');
      p.archived = true;
      await postRepo.save(p);
      const res = await service.searchPosts('sunset');
      expect(res).toHaveLength(0);
    });

    it('returns empty array for empty query', async () => {
      const a = await newUser('a4');
      await newPost(a.id, 'whatever');
      const res = await service.searchPosts('');
      expect(res).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------
  // searchReels
  // ------------------------------------------------------------------
  describe('searchReels', () => {
    it('matches only reels by caption', async () => {
      const a = await newUser('a5');
      await newPost(a.id, 'sunset regular post');
      await newReel(a.id, 'sunset reel clip');
      const res = await service.searchReels('sunset');
      expect(res).toHaveLength(1);
      expect(res[0].isReel).toBe(true);
    });

    it('excludes archived reels', async () => {
      const a = await newUser('a6');
      const r = await newReel(a.id, 'archived reel sunset');
      r.archived = true;
      await postRepo.save(r);
      const res = await service.searchReels('sunset');
      expect(res).toHaveLength(0);
    });

    it('returns empty array for empty query', async () => {
      const a = await newUser('a7');
      await newReel(a.id, 'something');
      const res = await service.searchReels('');
      expect(res).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------
  // searchHashtags
  // ------------------------------------------------------------------
  describe('searchHashtags', () => {
    it('returns tags matching the query prefix (case-insensitive)', async () => {
      const a = await newUser('a8');
      await newPost(a.id, 'caption', ['sunset', 'travel']);
      await newReel(a.id, 'caption', ['sunsetvibes', 'music']);
      const res = await service.searchHashtags('sun');
      expect(res).toHaveLength(2);
      const tags = res.map((r) => r.tag).sort();
      expect(tags).toEqual(['sunset', 'sunsetvibes']);
    });

    it('counts posts vs reels per tag', async () => {
      const a = await newUser('a9');
      await newPost(a.id, 'p1', ['travel']);
      await newPost(a.id, 'p2', ['travel']);
      await newReel(a.id, 'r1', ['travel']);
      const res = await service.searchHashtags('travel');
      expect(res).toHaveLength(1);
      expect(res[0].postsCount).toBe(2);
      expect(res[0].reelsCount).toBe(1);
      expect(res[0].total).toBe(3);
    });

    it('sorts by total count desc', async () => {
      const a = await newUser('a10');
      await newPost(a.id, 'p1', ['rare']);
      await newPost(a.id, 'p2', ['popular']);
      await newPost(a.id, 'p3', ['popular']);
      await newReel(a.id, 'r1', ['popular']);
      const res = await service.searchHashtags('p'); // matches "popular" only
      const popular = res.find((r) => r.tag === 'popular');
      const rare = res.find((r) => r.tag === 'rare');
      expect(popular).toBeDefined();
      expect(rare).toBeUndefined(); // 'rare' doesn't start with 'p'
    });

    it('returns empty array for empty query', async () => {
      const a = await newUser('a11');
      await newPost(a.id, 'x', ['tag']);
      const res = await service.searchHashtags('');
      expect(res).toHaveLength(0);
    });

    it('strips leading # from query', async () => {
      const a = await newUser('a12');
      await newPost(a.id, 'x', ['cats']);
      const res = await service.searchHashtags('#cats');
      expect(res).toHaveLength(1);
      expect(res[0].tag).toBe('cats');
    });
  });

  // ------------------------------------------------------------------
  // searchAll (unified)
  // ------------------------------------------------------------------
  describe('searchAll', () => {
    it('returns users, posts, reels, hashtags in one response', async () => {
      const a = await newUser('sunsetlover', 'Sunset Lover');
      await newPost(a.id, 'look at this sunset', ['sunset']);
      await newReel(a.id, 'sunset timelapse', ['sunset']);
      const res = await service.searchAll('sunset');
      expect(res.users).toHaveLength(1);
      expect(res.posts).toHaveLength(1);
      expect(res.reels).toHaveLength(1);
      expect(res.hashtags).toHaveLength(1);
      expect(res.hashtags[0].total).toBe(2);
    });

    it('returns empty arrays for empty query', async () => {
      const res = await service.searchAll('');
      expect(res.users).toHaveLength(0);
      expect(res.posts).toHaveLength(0);
      expect(res.reels).toHaveLength(0);
      expect(res.hashtags).toHaveLength(0);
    });
  });
});
