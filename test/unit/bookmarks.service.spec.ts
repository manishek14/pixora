import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarksService } from '@/modules/bookmarks/bookmarks.service';
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { PostsService } from '@/modules/posts/posts.service';
import { PostEntity } from '@/modules/posts/post.entity';
import { UserEntity } from '@/modules/users/user.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity } from '@/modules/highlights/entities/highlight-item.entity';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
import { NotFoundException } from '@nestjs/common';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let postsService: PostsService;
  let bookmarkRepo: Repository<BookmarkEntity>;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;
  let moduleRef: any;

  const newUser = async (username: string) => {
    const user = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
    });
    return userRepo.save(user);
  };

  const newPost = async (authorId: string, caption: string) => {
    return postsService.create(authorId, {
      mediaUrls: [`https://cdn.test/${caption}.jpg`],
      caption,
    } as any);
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
        TypeOrmModule.forFeature([BookmarkEntity, PostEntity, UserEntity]),
      ],
      providers: [BookmarksService, PostsService],
    }).compile();

    service = moduleRef.get(BookmarksService);
    postsService = moduleRef.get(PostsService);
    bookmarkRepo = moduleRef.get(getRepositoryToken(BookmarkEntity));
    postRepo = moduleRef.get(getRepositoryToken(PostEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await bookmarkRepo.clear();
    await postRepo.clear();
    await userRepo.clear();
  });

  describe('toggle', () => {
    it('returns true on first bookmark (creates)', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const post = await newPost(author.id, 'first');

      const result = await service.toggle(saver.id, post.id);
      expect(result).toBe(true);

      const count = await bookmarkRepo.count({
        where: { userId: saver.id, postId: post.id },
      });
      expect(count).toBe(1);
    });

    it('returns false on second toggle (removes)', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const post = await newPost(author.id, 'first');

      await service.toggle(saver.id, post.id);
      const result = await service.toggle(saver.id, post.id);
      expect(result).toBe(false);

      const count = await bookmarkRepo.count({
        where: { userId: saver.id, postId: post.id },
      });
      expect(count).toBe(0);
    });

    it('throws NotFound when post does not exist', async () => {
      const saver = await newUser('bob');
      await expect(service.toggle(saver.id, 'nope-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows multiple users to bookmark the same post independently', async () => {
      const author = await newUser('alice');
      const post = await newPost(author.id, 'shared');
      const bob = await newUser('bob');
      const carol = await newUser('carol');

      expect(await service.toggle(bob.id, post.id)).toBe(true);
      expect(await service.toggle(carol.id, post.id)).toBe(true);
      expect(await bookmarkRepo.count({ where: { postId: post.id } })).toBe(2);
    });
  });

  describe('isBookmarked', () => {
    it('returns true after toggling on, false after toggling off', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const post = await newPost(author.id, 'p');

      expect(await service.isBookmarked(saver.id, post.id)).toBe(false);
      await service.toggle(saver.id, post.id);
      expect(await service.isBookmarked(saver.id, post.id)).toBe(true);
      await service.toggle(saver.id, post.id);
      expect(await service.isBookmarked(saver.id, post.id)).toBe(false);
    });

    it('returns false when post does not exist (no bookmark either way)', async () => {
      const saver = await newUser('bob');
      expect(await service.isBookmarked(saver.id, 'nope-id')).toBe(false);
    });
  });

  describe('list', () => {
    it('returns bookmarked posts newest-first', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const p1 = await newPost(author.id, 'first');
      const p2 = await newPost(author.id, 'second');

      await service.toggle(saver.id, p1.id);
      await new Promise((r) => setTimeout(r, 100));
      await service.toggle(saver.id, p2.id);

      const result = await service.list(saver.id);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(p2.id); // newest bookmark first
      expect(result.items[1].id).toBe(p1.id);
      expect(result.hasMore).toBe(false);
    });

    it('excludes archived posts from the list (bookmark row stays)', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const p1 = await newPost(author.id, 'first');
      const p2 = await newPost(author.id, 'second');
      await service.toggle(saver.id, p1.id);
      await service.toggle(saver.id, p2.id);

      // archive p1 (author-only via PostsService.archive)
      await postsService.archive(p1.id, author.id, true);

      const result = await service.list(saver.id);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(p2.id);
      // but the bookmark row is still there
      expect(await bookmarkRepo.count({ where: { userId: saver.id } })).toBe(2);
    });

    it('respects limit + offset for pagination', async () => {
      const author = await newUser('alice');
      const saver = await newUser('bob');
      const posts: string[] = [];
      for (let i = 0; i < 5; i++) {
        const p = await newPost(author.id, `p${i}`);
        await service.toggle(saver.id, p.id);
        posts.push(p.id);
        await new Promise((r) => setTimeout(r, 5));
      }
      const page1 = await service.list(saver.id, 2, 0);
      const page2 = await service.list(saver.id, 2, 2);
      const page3 = await service.list(saver.id, 2, 4);
      expect(page1.items).toHaveLength(2);
      expect(page1.hasMore).toBe(true);
      expect(page2.items).toHaveLength(2);
      expect(page2.hasMore).toBe(true);
      expect(page3.items).toHaveLength(1);
      expect(page3.hasMore).toBe(false);
    });

    it('returns empty list when user has no bookmarks', async () => {
      const saver = await newUser('bob');
      const result = await service.list(saver.id);
      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('countByUser', () => {
    it('counts only the user\'s bookmarks', async () => {
      const author = await newUser('alice');
      const bob = await newUser('bob');
      const carol = await newUser('carol');
      const p1 = await newPost(author.id, 'p1');
      const p2 = await newPost(author.id, 'p2');
      const p3 = await newPost(author.id, 'p3');
      await service.toggle(bob.id, p1.id);
      await service.toggle(bob.id, p2.id);
      await service.toggle(carol.id, p3.id);

      expect(await service.countByUser(bob.id)).toBe(2);
      expect(await service.countByUser(carol.id)).toBe(1);
      expect(await service.countByUser(author.id)).toBe(0);
    });
  });
});
