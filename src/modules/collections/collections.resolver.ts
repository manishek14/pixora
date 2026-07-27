import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionEntity } from './collection.entity';
import { CollectionItemEntity } from './collection-item.entity';
import { CollectionListResult } from './collection-list-result';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => CollectionEntity)
export class CollectionsResolver {
  constructor(private readonly collections: CollectionsService) {}

  @Query(() => CollectionListResult, {
    name: 'myCollections',
    description: 'فهرست مجموعه‌های ذخیره‌شده توسط کاربر فعلی (به ترتیب الفبا)',
  })
  @UseGuards(GqlAuthGuard)
  async myCollections(
    @CurrentUser() user: UserEntity,
  ): Promise<CollectionListResult> {
    return this.collections.list(user.id);
  }

  @Query(() => CollectionEntity, {
    name: 'collection',
    description: 'مشاهده یک مجموعه با محتویات آن (فقط مالک)',
  })
  @UseGuards(GqlAuthGuard)
  async collection(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CollectionEntity> {
    return this.collections.get(id, user.id);
  }

  @Mutation(() => CollectionEntity, {
    name: 'createCollection',
    description: 'ایجاد مجموعه جدید برای سازمان‌دهی پست‌های ذخیره‌شده',
  })
  @UseGuards(GqlAuthGuard)
  async createCollection(
    @CurrentUser() user: UserEntity,
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
  ): Promise<CollectionEntity> {
    return this.collections.create(user.id, name, description);
  }

  @Mutation(() => CollectionEntity, {
    name: 'updateCollection',
    description: 'به‌روزرسانی نام یا توضیحات یک مجموعه',
  })
  @UseGuards(GqlAuthGuard)
  async updateCollection(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
    @Args('name', { nullable: true }) name: string,
    @Args('description', { nullable: true }) description?: string,
  ): Promise<CollectionEntity> {
    return this.collections.update(id, user.id, name, description);
  }

  @Mutation(() => Boolean, {
    name: 'deleteCollection',
    description: 'حذف یک مجموعه (پست‌های داخل آن حذف نمی‌شوند)',
  })
  @UseGuards(GqlAuthGuard)
  async deleteCollection(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.collections.delete(id, user.id);
  }

  @Mutation(() => CollectionItemEntity, {
    name: 'addToCollection',
    description: 'افزودن یک پست به مجموعه (اگر قبلاً اضافه شده باشد، idempotent است)',
  })
  @UseGuards(GqlAuthGuard)
  async addToCollection(
    @CurrentUser() user: UserEntity,
    @Args('collectionId', { type: () => ID }) collectionId: string,
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<CollectionItemEntity> {
    return this.collections.addItem(collectionId, postId, user.id);
  }

  @Mutation(() => Boolean, {
    name: 'removeFromCollection',
    description: 'حذف یک پست از مجموعه',
  })
  @UseGuards(GqlAuthGuard)
  async removeFromCollection(
    @CurrentUser() user: UserEntity,
    @Args('collectionId', { type: () => ID }) collectionId: string,
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.collections.removeItem(collectionId, postId, user.id);
  }
}
