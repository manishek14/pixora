import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CollectionEntity } from './collection.entity';
import { CollectionItemEntity } from './collection-item.entity';
import { PostEntity } from '../posts/post.entity';
import { CollectionListResult } from './collection-list-result';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
    @InjectRepository(CollectionItemEntity)
    private readonly itemRepo: Repository<CollectionItemEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  /**
   * Create a new collection for `userId`. The name must be unique per user.
   * Returns the freshly-created collection.
   */
  async create(
    userId: string,
    name: string,
    description?: string,
  ): Promise<CollectionEntity> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('collection name cannot be empty');
    }
    if (trimmed.length > 60) {
      throw new BadRequestException('collection name too long (max 60 chars)');
    }

    const existing = await this.collectionRepo.findOne({
      where: { userId, name: trimmed },
    });
    if (existing) {
      throw new BadRequestException('a collection with this name already exists');
    }

    const collection = this.collectionRepo.create({
      userId,
      name: trimmed,
      description: description?.trim() || undefined,
    });
    return this.collectionRepo.save(collection);
  }

  /**
   * List all collections owned by `userId`, alphabetically by name.
   * Returns each collection WITHOUT preloading items (call getCollection for
   * that — keeps the list endpoint lightweight).
   */
  async list(userId: string): Promise<CollectionListResult> {
    const [items, total] = await this.collectionRepo.findAndCount({
      where: { userId },
      order: { name: 'ASC' },
    });
    return { items, total };
  }

  /**
   * Get a single collection by ID, including its items (with posts preloaded).
   * Only the owner can read a collection's contents.
   */
  async get(collectionId: string, requesterId: string): Promise<CollectionEntity> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
      relations: ['items', 'items.post', 'items.post.author'],
    });
    if (!collection) throw new NotFoundException('collection not found');
    if (collection.userId !== requesterId) {
      throw new ForbiddenException('cannot read another user\'s collection');
    }
    return collection;
  }

  /** Update a collection's name/description. */
  async update(
    collectionId: string,
    requesterId: string,
    name?: string,
    description?: string,
  ): Promise<CollectionEntity> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('collection not found');
    if (collection.userId !== requesterId) {
      throw new ForbiddenException('cannot edit another user\'s collection');
    }

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new BadRequestException('collection name cannot be empty');
      }
      // Uniqueness check (only if name actually changed)
      if (trimmed !== collection.name) {
        const clash = await this.collectionRepo.findOne({
          where: { userId: requesterId, name: trimmed },
        });
        if (clash) {
          throw new BadRequestException('a collection with this name already exists');
        }
        collection.name = trimmed;
      }
    }

    if (description !== undefined) {
      collection.description = description.trim() || undefined;
    }

    return this.collectionRepo.save(collection);
  }

  /** Delete a collection. Returns true if a row was removed. */
  async delete(collectionId: string, requesterId: string): Promise<boolean> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) return false;
    if (collection.userId !== requesterId) {
      throw new ForbiddenException('cannot delete another user\'s collection');
    }
    await this.collectionRepo.remove(collection);
    return true;
  }

  /**
   * Add a post to a collection. Idempotent — if the post is already in the
   * collection, returns the existing item row.
   */
  async addItem(
    collectionId: string,
    postId: string,
    requesterId: string,
  ): Promise<CollectionItemEntity> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('collection not found');
    if (collection.userId !== requesterId) {
      throw new ForbiddenException('cannot add to another user\'s collection');
    }

    // Verify post exists
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');

    const existing = await this.itemRepo.findOne({
      where: { collectionId, postId },
    });
    if (existing) return existing;

    const item = this.itemRepo.create({
      collectionId,
      postId,
      createdAt: new Date(),
    });
    return this.itemRepo.save(item);
  }

  /** Remove a post from a collection. Returns true if a row was removed. */
  async removeItem(
    collectionId: string,
    postId: string,
    requesterId: string,
  ): Promise<boolean> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) return false;
    if (collection.userId !== requesterId) {
      throw new ForbiddenException('cannot remove from another user\'s collection');
    }
    const result = await this.itemRepo.delete({ collectionId, postId });
    return (result.affected ?? 0) > 0;
  }

  /** Returns the count of items in a collection (used for cover rendering). */
  async itemCount(collectionId: string): Promise<number> {
    return this.itemRepo.count({ where: { collectionId } });
  }
}
