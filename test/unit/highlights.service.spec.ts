import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HighlightsService } from '@/modules/highlights/highlights.service';
import { AuthService } from '@/modules/auth/auth.service';
import { FollowsService } from '@/modules/follows/follows.service';
import { StoriesService } from '@/modules/stories/stories.service';
import { UserEntity } from '@/modules/users/user.entity';
import { PostEntity } from '@/modules/posts/post.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { StoryMediaType } from '@/modules/stories/entities/story.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity, HighlightMediaType } from '@/modules/highlights/entities/highlight-item.entity';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { JwtModule } from '@nestjs/jwt';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Unit + integration tests for HighlightsService.
 *
 * Covers:
 *  - create with items
 *  - validation: empty items rejected
 *  - update (title, coverUrl, full items replacement)
 *  - delete (author only)
 *  - createFromStories (copies media so highlight survives story deletion)
 *  - public read of any user's highlights
 */
describe('HighlightsService', () => {
  let service: HighlightsService;
  let stories: StoriesService;
  let auth: AuthService;
  let itemRepo: Repository<HighlightItemEntity>;
  let moduleRef: TestingModule;
  let alice: UserEntity;
  let bob: UserEntity;

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
            LikeEntity,
            CommentEntity,
            FollowEntity,
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
          HighlightEntity,
          HighlightItemEntity,
          StoryEntity,
          StoryViewEntity,
          StoryReactionEntity,
          UserEntity,
          FollowEntity,
          PostEntity,
          LikeEntity,
          CommentEntity,
        ]),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
      ],
      providers: [HighlightsService, StoriesService, AuthService, FollowsService],
    }).compile();

    service = moduleRef.get(HighlightsService);
    stories = moduleRef.get(StoriesService);
    auth = moduleRef.get(AuthService);
    itemRepo = moduleRef.get(getRepositoryToken(HighlightItemEntity));

    alice = (await auth.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'Str0ng!Pass',
    })).user;
    bob = (await auth.register({
      username: 'bob',
      email: 'bob@example.com',
      password: 'Str0ng!Pass',
    })).user;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('create', () => {
    it('creates a highlight with multiple items in order', async () => {
      const hl = await service.create(alice.id, {
        title: 'Travel',
        coverUrl: 'https://cdn.lenz.app/cover.jpg',
        items: [
          { mediaUrl: 'https://cdn.lenz.app/1.jpg', mediaType: HighlightMediaType.Image, caption: 'Day 1' },
          { mediaUrl: 'https://cdn.lenz.app/2.mp4', mediaType: HighlightMediaType.Video },
          { mediaUrl: 'https://cdn.lenz.app/3.jpg', mediaType: HighlightMediaType.Image, caption: 'Day 3' },
        ],
      });

      expect(hl.title).toBe('Travel');
      expect(hl.coverUrl).toBe('https://cdn.lenz.app/cover.jpg');
      expect(hl.userId).toBe(alice.id);
      expect(hl.items).toHaveLength(3);
      // Items should be eagerly loaded and ordered by `order`
      const orders = hl.items.map((i) => i.order);
      expect(orders).toEqual([0, 1, 2]);
      expect(hl.items[0].caption).toBe('Day 1');
      expect(hl.items[1].mediaType).toBe(HighlightMediaType.Video);
    });

    it('rejects highlight with no items', async () => {
      await expect(
        service.create(alice.id, {
          title: 'Empty',
          items: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates title only when items not provided', async () => {
      const hl = await service.create(alice.id, {
        title: 'Old',
        items: [
          { mediaUrl: 'https://cdn.lenz.app/a.jpg', mediaType: HighlightMediaType.Image },
        ],
      });
      const updated = await service.update(alice.id, hl.id, { title: 'New' });
      expect(updated.title).toBe('New');
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].mediaUrl).toBe('https://cdn.lenz.app/a.jpg');
    });

    it('replaces items when items array provided', async () => {
      const hl = await service.create(alice.id, {
        title: 'Replacements',
        items: [
          { mediaUrl: 'https://cdn.lenz.app/old.jpg', mediaType: HighlightMediaType.Image },
        ],
      });
      const before = await itemRepo.count({ where: { highlightId: hl.id } });
      expect(before).toBe(1);

      const updated = await service.update(alice.id, hl.id, {
        items: [
          { mediaUrl: 'https://cdn.lenz.app/new1.jpg', mediaType: HighlightMediaType.Image },
          { mediaUrl: 'https://cdn.lenz.app/new2.jpg', mediaType: HighlightMediaType.Image },
        ],
      });

      expect(updated.items).toHaveLength(2);
      const after = await itemRepo.count({ where: { highlightId: hl.id } });
      expect(after).toBe(2);
      // Old item gone
      const stillOld = await itemRepo.findOne({
        where: { highlightId: hl.id, mediaUrl: 'https://cdn.lenz.app/old.jpg' },
      });
      expect(stillOld).toBeNull();
    });

    it('forbids non-owner from updating', async () => {
      const hl = await service.create(alice.id, {
        title: 'Alice Only',
        items: [{ mediaUrl: 'https://cdn.lenz.app/x.jpg', mediaType: HighlightMediaType.Image }],
      });
      await expect(
        service.update(bob.id, hl.id, { title: 'Hacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound when highlight does not exist', async () => {
      await expect(
        service.update(alice.id, '00000000-0000-0000-0000-000000000000', { title: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('allows owner to delete their highlight', async () => {
      const hl = await service.create(alice.id, {
        title: 'To Delete',
        items: [{ mediaUrl: 'https://cdn.lenz.app/x.jpg', mediaType: HighlightMediaType.Image }],
      });
      const ok = await service.delete(alice.id, hl.id);
      expect(ok).toBe(true);
      await expect(service.getById(hl.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids non-owner from deleting', async () => {
      const hl = await service.create(alice.id, {
        title: 'Alice Only',
        items: [{ mediaUrl: 'https://cdn.lenz.app/x.jpg', mediaType: HighlightMediaType.Image }],
      });
      await expect(service.delete(bob.id, hl.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('cascade-deletes highlight items when highlight is deleted', async () => {
      const hl = await service.create(alice.id, {
        title: 'Cascade Test',
        items: [
          { mediaUrl: 'https://cdn.lenz.app/a.jpg', mediaType: HighlightMediaType.Image },
          { mediaUrl: 'https://cdn.lenz.app/b.jpg', mediaType: HighlightMediaType.Image },
          { mediaUrl: 'https://cdn.lenz.app/c.jpg', mediaType: HighlightMediaType.Image },
        ],
      });
      const itemId = hl.items[0].id;
      await service.delete(alice.id, hl.id);
      const stillThere = await itemRepo.findOneBy({ id: itemId });
      expect(stillThere).toBeNull();
    });
  });

  describe('createFromStories', () => {
    it('builds a highlight by copying media from existing stories', async () => {
      const story1 = await stories.create(alice.id, {
        mediaUrl: 'https://cdn.lenz.app/s1.jpg',
        mediaType: StoryMediaType.Image,
        caption: 'Story 1 caption',
      });
      const story2 = await stories.create(alice.id, {
        mediaUrl: 'https://cdn.lenz.app/s2.mp4',
        mediaType: StoryMediaType.Video,
      });

      const hl = await service.createFromStories(
        alice.id,
        'My Stories',
        [story2.id, story1.id], // order matters
      );

      expect(hl.items).toHaveLength(2);
      // First item should be story2 (we passed [s2, s1])
      expect(hl.items[0].mediaUrl).toBe('https://cdn.lenz.app/s2.mp4');
      expect(hl.items[0].mediaType).toBe(HighlightMediaType.Video);
      expect(hl.items[1].mediaUrl).toBe('https://cdn.lenz.app/s1.jpg');
      expect(hl.items[1].mediaType).toBe(HighlightMediaType.Image);
      expect(hl.items[1].caption).toBe('Story 1 caption');
    });

    it('rejects when no story ids provided', async () => {
      await expect(
        service.createFromStories(alice.id, 'Empty', []),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when a story id does not exist', async () => {
      await expect(
        service.createFromStories(alice.id, 'Bad', ['00000000-0000-0000-0000-000000000000']),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when a story belongs to another user', async () => {
      const bobStory = await stories.create(bob.id, {
        mediaUrl: 'https://cdn.lenz.app/bob.jpg',
        mediaType: StoryMediaType.Image,
      });
      await expect(
        service.createFromStories(alice.id, 'Stolen', [bobStory.id]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('highlight survives after the source story is deleted', async () => {
      const story = await stories.create(alice.id, {
        mediaUrl: 'https://cdn.lenz.app/temp.jpg',
        mediaType: StoryMediaType.Image,
      });
      const hl = await service.createFromStories(alice.id, 'Survivor', [story.id]);

      // Delete the source story
      await stories.delete(alice.id, story.id);

      // Highlight should still be there with its media
      const refetched = await service.getById(hl.id);
      expect(refetched.items).toHaveLength(1);
      expect(refetched.items[0].mediaUrl).toBe('https://cdn.lenz.app/temp.jpg');
    });
  });

  describe('getByUser / getById', () => {
    it('returns all highlights for a user', async () => {
      const before = await service.getByUser(alice.id);
      const beforeCount = before.length;

      const a = await service.create(alice.id, {
        title: 'First',
        items: [{ mediaUrl: 'https://cdn.lenz.app/a.jpg', mediaType: HighlightMediaType.Image }],
      });
      const b = await service.create(alice.id, {
        title: 'Second',
        items: [{ mediaUrl: 'https://cdn.lenz.app/b.jpg', mediaType: HighlightMediaType.Image }],
      });

      const list = await service.getByUser(alice.id);
      expect(list).toHaveLength(beforeCount + 2);
      // Both new highlights should be present
      const ids = list.map((h) => h.id);
      expect(ids).toContain(a.id);
      expect(ids).toContain(b.id);
    });

    it('anyone can read a user\'s highlights (public)', async () => {
      const hl = await service.create(alice.id, {
        title: 'Public',
        items: [{ mediaUrl: 'https://cdn.lenz.app/x.jpg', mediaType: HighlightMediaType.Image }],
      });
      const fetched = await service.getById(hl.id);
      expect(fetched.id).toBe(hl.id);
      // Bob (not the owner) can also fetch it
      // (no auth check on getById — public by design)
    });

    it('throws NotFound for unknown id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
