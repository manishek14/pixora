import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionsService } from '@/modules/collections/collections.service';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
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
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionRepo: Repository<CollectionEntity>;
  let itemRepo: Repository<CollectionItemEntity>;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;
  let postsService: PostsService;
  let moduleRef: any;

  const newUser = async (username: string) => {
    return userRepo.save(
      userRepo.create({
        username,
        email: `${username}@test.com`,
        password: 'hashed',
      }),
    );
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
            BlockEntity,
            MuteEntity,
            CollectionEntity,
            CollectionItemEntity,
            NotificationEntity,
            MessageThreadEntity,
            MessageEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          CollectionEntity,
          CollectionItemEntity,
          PostEntity,
          UserEntity,
        ]),
      ],
      providers: [CollectionsService, PostsService],
    }).compile();

    service = moduleRef.get(CollectionsService);
    collectionRepo = moduleRef.get(getRepositoryToken(CollectionEntity));
    itemRepo = moduleRef.get(getRepositoryToken(CollectionItemEntity));
    postRepo = moduleRef.get(getRepositoryToken(PostEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    postsService = moduleRef.get(PostsService);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await itemRepo.clear();
    await collectionRepo.clear();
    await postRepo.clear();
    await userRepo.clear();
  });

  describe('create', () => {
    it('creates a collection', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Recipes');
      expect(c.userId).toBe(alice.id);
      expect(c.name).toBe('Recipes');
      expect(c.description).toBeFalsy();
    });

    it('creates a collection with description', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel', 'Inspo for trips');
      expect(c.description).toBe('Inspo for trips');
    });

    it('rejects empty name', async () => {
      const alice = await newUser('alice');
      await expect(service.create(alice.id, '   ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects duplicate name per user', async () => {
      const alice = await newUser('alice');
      await service.create(alice.id, 'Recipes');
      await expect(service.create(alice.id, 'Recipes')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('allows two different users to have the same collection name', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.create(alice.id, 'Recipes');
      const bobCollection = await service.create(bob.id, 'Recipes');
      expect(bobCollection.userId).toBe(bob.id);
    });
  });

  describe('list', () => {
    it('returns all collections alphabetically', async () => {
      const alice = await newUser('alice');
      await service.create(alice.id, 'Travel');
      await service.create(alice.id, 'Recipes');
      await service.create(alice.id, 'Outfits');
      const list = await service.list(alice.id);
      expect(list.total).toBe(3);
      const names = list.items.map((c) => c.name);
      expect(names).toEqual(['Outfits', 'Recipes', 'Travel']);
    });

    it('returns empty when user has no collections', async () => {
      const alice = await newUser('alice');
      const list = await service.list(alice.id);
      expect(list.total).toBe(0);
      expect(list.items).toEqual([]);
    });

    it('does not return other users\' collections', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      await service.create(alice.id, 'AliceRecipes');
      await service.create(bob.id, 'BobRecipes');
      const aliceList = await service.list(alice.id);
      expect(aliceList.total).toBe(1);
      expect(aliceList.items[0].name).toBe('AliceRecipes');
    });
  });

  describe('get', () => {
    it('returns a collection with items preloaded', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      await service.addItem(c.id, post.id, alice.id);
      const fetched = await service.get(c.id, alice.id);
      expect(fetched.items).toHaveLength(1);
      expect(fetched.items[0].postId).toBe(post.id);
    });

    it('throws NotFound for unknown id', async () => {
      const alice = await newUser('alice');
      await expect(
        service.get('00000000-0000-0000-0000-000000000000', alice.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when requester is not the owner', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const c = await service.create(alice.id, 'Travel');
      await expect(service.get(c.id, bob.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('updates name only', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Old');
      const updated = await service.update(c.id, alice.id, 'New');
      expect(updated.name).toBe('New');
    });

    it('updates description only', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel');
      const updated = await service.update(c.id, alice.id, undefined, 'New desc');
      expect(updated.name).toBe('Travel');
      expect(updated.description).toBe('New desc');
    });

    it('rejects duplicate name update (collision with another collection)', async () => {
      const alice = await newUser('alice');
      await service.create(alice.id, 'One');
      const c2 = await service.create(alice.id, 'Two');
      await expect(service.update(c2.id, alice.id, 'One')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('allows setting name to its current value', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel');
      const updated = await service.update(c.id, alice.id, 'Travel');
      expect(updated.name).toBe('Travel');
    });

    it('throws Forbidden when requester is not the owner', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const c = await service.create(alice.id, 'Travel');
      await expect(service.update(c.id, bob.id, 'Hack')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('deletes a collection owned by the user', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel');
      const result = await service.delete(c.id, alice.id);
      expect(result).toBe(true);
      expect(await collectionRepo.count()).toBe(0);
    });

    it('returns false when deleting a non-existent collection', async () => {
      const alice = await newUser('alice');
      const result = await service.delete('00000000-0000-0000-0000-000000000000', alice.id);
      expect(result).toBe(false);
    });

    it('throws Forbidden when deleting another user\'s collection', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const c = await service.create(alice.id, 'Travel');
      await expect(service.delete(c.id, bob.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('cascades to items when the collection is deleted', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      await service.addItem(c.id, post.id, alice.id);
      expect(await itemRepo.count()).toBe(1);
      await service.delete(c.id, alice.id);
      expect(await itemRepo.count()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('adds a post to a collection', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      const item = await service.addItem(c.id, post.id, alice.id);
      expect(item.collectionId).toBe(c.id);
      expect(item.postId).toBe(post.id);
    });

    it('is idempotent — re-adding the same post returns the existing item', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      const first = await service.addItem(c.id, post.id, alice.id);
      const second = await service.addItem(c.id, post.id, alice.id);
      expect(second.id).toBe(first.id);
      expect(await itemRepo.count()).toBe(1);
    });

    it('allows the same post in multiple collections', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c1 = await service.create(alice.id, 'Travel');
      const c2 = await service.create(alice.id, 'Outfits');
      await service.addItem(c1.id, post.id, alice.id);
      await service.addItem(c2.id, post.id, alice.id);
      expect(await itemRepo.count()).toBe(2);
    });

    it('throws NotFound for unknown post', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel');
      await expect(
        service.addItem(c.id, '00000000-0000-0000-0000-000000000000', alice.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when requester is not the owner', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      await expect(service.addItem(c.id, post.id, bob.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('removeItem', () => {
    it('removes a post from a collection', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      await service.addItem(c.id, post.id, alice.id);
      const result = await service.removeItem(c.id, post.id, alice.id);
      expect(result).toBe(true);
      expect(await itemRepo.count()).toBe(0);
    });

    it('returns false when the item does not exist', async () => {
      const alice = await newUser('alice');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      const result = await service.removeItem(c.id, post.id, alice.id);
      expect(result).toBe(false);
    });

    it('throws Forbidden when requester is not the owner', async () => {
      const alice = await newUser('alice');
      const bob = await newUser('bob');
      const post = await newPost(alice.id, 'first');
      const c = await service.create(alice.id, 'Travel');
      await service.addItem(c.id, post.id, alice.id);
      await expect(service.removeItem(c.id, post.id, bob.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('itemCount', () => {
    it('returns the number of items in a collection', async () => {
      const alice = await newUser('alice');
      const p1 = await newPost(alice.id, 'first');
      const p2 = await newPost(alice.id, 'second');
      const c = await service.create(alice.id, 'Travel');
      await service.addItem(c.id, p1.id, alice.id);
      await service.addItem(c.id, p2.id, alice.id);
      expect(await service.itemCount(c.id)).toBe(2);
    });

    it('returns 0 for an empty collection', async () => {
      const alice = await newUser('alice');
      const c = await service.create(alice.id, 'Travel');
      expect(await service.itemCount(c.id)).toBe(0);
    });
  });
});
