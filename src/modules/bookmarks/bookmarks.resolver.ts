import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { BookmarkListResult } from './bookmark-list-result';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => BookmarkListResult)
export class BookmarksResolver {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Query(() => BookmarkListResult, {
    name: 'myBookmarks',
    description: 'پست‌های ذخیره‌شده توسط کاربر فعلی',
  })
  @UseGuards(GqlAuthGuard)
  async myBookmarks(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<BookmarkListResult> {
    return this.bookmarks.list(user.id, limit, offset);
  }

  @Query(() => Boolean, {
    name: 'isBookmarked',
    description: 'آیا پست توسط کاربر فعلی ذخیره شده؟',
  })
  @UseGuards(GqlAuthGuard)
  async isBookmarked(
    @CurrentUser() user: UserEntity,
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.bookmarks.isBookmarked(user.id, postId);
  }

  @Mutation(() => Boolean, {
    name: 'toggleBookmark',
    description: 'ذخیره/حذف پست (تاگل). برمی‌گرداند: true اگر ذخیره شد، false اگر حذف شد',
  })
  @UseGuards(GqlAuthGuard)
  async toggleBookmark(
    @CurrentUser() user: UserEntity,
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.bookmarks.toggle(user.id, postId);
  }
}
