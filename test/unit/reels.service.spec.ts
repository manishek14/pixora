import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReelsService } from '@/modules/reels/reels.service';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
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
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { CreateReelInput } from '@/modules/reels/dto/create-reel.input';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('ReelsService', () => {
  let service: ReelsService;
  let postRepo: Repository<PostEntity>;
  let viewRepo: Repository<ReelViewEntity>;
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
            BlockEntity,
            MuteEntity,
            CollectionEntity,
            CollectionItemEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([PostEntity, ReelViewEntity, UserEntity]),
      ],
      providers: [ReelsService],
    }).compile();

    service = moduleRef.get(ReelsService);
    postRepo = moduleRef.get(getRepositoryToken(PostEntity));
    viewRepo = moduleRef.get(getRepositoryToken(ReelViewEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await viewRepo.clear();
    await postRepo.clear();
    await userRepo.clear();
  });

  describe('create', () => {
    it('creates a reel with isReel=true and reel-specific fields', async () => {
      const author = await newUser('alice');
      const input: CreateReelInput = {
        videoUrl: 'https://cdn.test/reel.mp4',
        audioTrack: 'original',
        durationSeconds: 30,
        caption: 'funny cat #cats',
      };
      const reel = await service.create(author.id, input);

      expect(reel.isReel).toBe(true);
      expect(reel.videoUrl).toBe('https://cdn.test/reel.mp4');
      expect(reel.audioTrack).toBe('original');
      expect(reel.durationSeconds).toBe(30);
      expect(reel.viewsCount).toBe(0);
      expect(reel.sharesCount).toBe(0);
      expect(reel.likesCount).toBe(0);
      expect(reel.archived).toBe(false);
      expect(reel.mediaUrls).toEqual(['https://cdn.test/reel.mp4']);
      expect(reel.hashtags).toEqual(['cats']);
      expect(reel.author).toBeDefined();
      expect(reel.author.id).toBe(author.id);
    });

    it('auto-extracts mentions from caption', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
        caption: 'shoutout @bob and @carol!',
      });
      expect(reel.mentions.sort()).toEqual(['bob', 'carol']);
    });

    it('respects explicit hashtags if provided', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
        caption: 'no hashtags here',
        hashtags: ['custom', 'tags'],
      });
      expect(reel.hashtags).toEqual(['custom', 'tags']);
    });
  });

  describe('getById', () => {
    it('returns the reel when it exists', async () => {
      const author = await newUser('alice');
      const created = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      const fetched = await service.getById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it('throws NotFound for non-reel posts', async () => {
      const author = await newUser('alice');
      const post = postRepo.create({
        authorId: author.id,
        mediaUrls: [],
        hashtags: [],
        mentions: [],
        isReel: false,
        archived: false,
      });
      const saved = await postRepo.save(post);
      await expect(service.getById(saved.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFound for archived reels', async () => {
      const author = await newUser('alice');
      const created = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await postRepo.update(created.id, { archived: true });
      await expect(service.getById(created.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('view (idempotent)', () => {
    it('increments viewsCount on first view only', async () => {
      const author = await newUser('alice');
      const viewer = await newUser('bob');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      const afterFirst = await service.view(viewer.id, reel.id);
      expect(afterFirst.viewsCount).toBe(1);
      const afterSecond = await service.view(viewer.id, reel.id);
      expect(afterSecond.viewsCount).toBe(1); // unchanged
    });

    it('different viewers each add a view', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await service.create((await newUser('bob')).id, {
        videoUrl: 'https://cdn.test/r2.mp4',
      });
      const bob = await userRepo.findOne({ where: { username: 'bob' } });
      const carol = await newUser('carol');
      await service.view(bob!.id, reel.id);
      await service.view(carol.id, reel.id);
      const final = await service.getById(reel.id);
      expect(final.viewsCount).toBe(2);
    });

    it('throws NotFound when viewing a non-existent reel', async () => {
      const viewer = await newUser('bob');
      await expect(service.view(viewer.id, 'nope-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('share', () => {
    it('increments sharesCount each time (not idempotent)', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await service.share(reel.id);
      await service.share(reel.id);
      const after = await service.getById(reel.id);
      expect(after.sharesCount).toBe(2);
    });
  });

  describe('delete', () => {
    it('lets the author delete their reel', async () => {
      const author = await newUser('alice');
      const other = await newUser('bob');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      expect(await service.delete(reel.id, author.id)).toBe(true);
      await expect(service.getById(reel.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids non-author from deleting', async () => {
      const author = await newUser('alice');
      const other = await newUser('bob');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await expect(service.delete(reel.id, other.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('getFeed', () => {
    it('returns reels ranked by engagement score + recency decay', async () => {
      const author = await newUser('alice');
      const r1 = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r1.mp4',
        caption: 'first',
      });
      // bump r1's engagement
      await postRepo.update(r1.id, { likesCount: 50, commentsCount: 10, viewsCount: 1000 });
      const r2 = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r2.mp4',
        caption: 'second',
      });

      const feed = await service.getFeed(author.id);
      expect(feed).toHaveLength(2);
      // r1 has much higher engagement → should be first
      expect(feed[0].id).toBe(r1.id);
      expect(feed[1].id).toBe(r2.id);
    });

    it('excludes archived reels', async () => {
      const author = await newUser('alice');
      const r1 = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r1.mp4',
      });
      const r2 = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r2.mp4',
      });
      await postRepo.update(r1.id, { archived: true });
      const feed = await service.getFeed(author.id);
      expect(feed).toHaveLength(1);
      expect(feed[0].id).toBe(r2.id);
    });

    it('excludes non-reel posts', async () => {
      const author = await newUser('alice');
      await postRepo.save(
        postRepo.create({
          authorId: author.id,
          mediaUrls: ['https://cdn.test/p.jpg'],
          hashtags: [],
          mentions: [],
          isReel: false,
          archived: false,
        }),
      );
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      const feed = await service.getFeed(author.id);
      expect(feed).toHaveLength(1);
      expect(feed[0].id).toBe(reel.id);
    });
  });

  describe('getByUser', () => {
    it('returns only that user\'s non-archived reels', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const r1 = await service.create(alice.id, {
        videoUrl: 'https://cdn.test/r1.mp4',
      });
      const r2 = await service.create(alice.id, {
        videoUrl: 'https://cdn.test/r2.mp4',
      });
      await service.create(bob.id, {
        videoUrl: 'https://cdn.test/r3.mp4',
      });
      await postRepo.update(r1.id, { archived: true });

      const list = await service.getByUser(alice.id);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(r2.id);
    });
  });

  describe('getByHashtag', () => {
    it('matches reels by hashtag (case-insensitive)', async () => {
      const author = await newUser('alice');
      await service.create(author.id, {
        videoUrl: 'https://cdn.test/r1.mp4',
        caption: '#cats are great',
      });
      await service.create(author.id, {
        videoUrl: 'https://cdn.test/r2.mp4',
        caption: '#dogs are better',
      });
      const cats = await service.getByHashtag('Cats');
      expect(cats).toHaveLength(1);
    });
  });

  describe('getViewers (author-only)', () => {
    it('returns viewers list for the author', async () => {
      const author = await newUser('alice');
      const viewer = await newUser('bob');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await service.view(viewer.id, reel.id);
      const viewers = await service.getViewers(author.id, reel.id);
      expect(viewers).toHaveLength(1);
      expect(viewers[0].userId).toBe(viewer.id);
    });

    it('forbids non-author from viewing viewers list', async () => {
      const author = await newUser('alice');
      const other = await newUser('bob');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await expect(service.getViewers(other.id, reel.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('increment/decrement counters', () => {
    it('increments likesCount', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await service.incrementLikes(reel.id);
      await service.incrementLikes(reel.id);
      const after = await service.getById(reel.id);
      expect(after.likesCount).toBe(2);
    });

    it('decrements commentsCount', async () => {
      const author = await newUser('alice');
      const reel = await service.create(author.id, {
        videoUrl: 'https://cdn.test/r.mp4',
      });
      await service.incrementComments(reel.id);
      await service.incrementComments(reel.id);
      await service.decrementComments(reel.id);
      const after = await service.getById(reel.id);
      expect(after.commentsCount).toBe(1);
    });
  });
});
