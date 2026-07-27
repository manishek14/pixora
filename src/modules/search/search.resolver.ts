import { Args, Query, Resolver, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { HashtagSearchResult, SearchResponse } from './search-types';
import { OptionalGqlAuthGuard } from '../auth/guards/optional-gql-auth.guard';

@Resolver()
export class SearchResolver {
  constructor(private readonly search: SearchService) {}

  /**
   * Search is public — but if the request carries a valid JWT, we honor the
   * viewer's block list (so blocked accounts don't surface in their results).
   * OptionalGqlAuthGuard sets `req.user` if a valid token is present without
   * rejecting the request when no token is supplied.
   */
  private viewerIdFromContext(ctx: { req?: { user?: { id: string } } }): string | undefined {
    return ctx.req?.user?.id;
  }

  @Query(() => [UserEntity], {
    name: 'searchUsers',
    description: 'جستجوی کاربر بر اساس username یا fullName',
  })
  @UseGuards(OptionalGqlAuthGuard)
  async searchUsers(
    @Context() ctx: { req?: { user?: { id: string } } },
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<UserEntity[]> {
    return this.search.searchUsers(query, limit, this.viewerIdFromContext(ctx));
  }

  @Query(() => [PostEntity], {
    name: 'searchPosts',
    description: 'جستجوی پست‌ها (غیر Reel) بر اساس caption — بایگانی‌شده‌ها حذف می‌شوند',
  })
  @UseGuards(OptionalGqlAuthGuard)
  async searchPosts(
    @Context() ctx: { req?: { user?: { id: string } } },
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.search.searchPosts(query, limit, this.viewerIdFromContext(ctx));
  }

  @Query(() => [PostEntity], {
    name: 'searchReels',
    description: 'جستجوی Reelها بر اساس caption — بایگانی‌شده‌ها حذف می‌شوند',
  })
  @UseGuards(OptionalGqlAuthGuard)
  async searchReels(
    @Context() ctx: { req?: { user?: { id: string } } },
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.search.searchReels(query, limit, this.viewerIdFromContext(ctx));
  }

  @Query(() => [HashtagSearchResult], {
    name: 'searchHashtags',
    description: 'جستجوی هشتگ‌ها — برمی‌گرداند: tag, postsCount, reelsCount, total',
  })
  async searchHashtags(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<HashtagSearchResult[]> {
    return this.search.searchHashtags(query, limit);
  }

  @Query(() => SearchResponse, {
    name: 'searchAll',
    description: 'جستجوی یکپارچه — کاربران، پست‌ها، Reelها و هشتگ‌ها در یک درخواست',
  })
  @UseGuards(OptionalGqlAuthGuard)
  async searchAll(
    @Context() ctx: { req?: { user?: { id: string } } },
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<SearchResponse> {
    return this.search.searchAll(query, limit, this.viewerIdFromContext(ctx));
  }
}
