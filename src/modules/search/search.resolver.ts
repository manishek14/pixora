import { Args, Query, Resolver, Int } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { HashtagSearchResult, SearchResponse } from './search-types';

@Resolver()
export class SearchResolver {
  constructor(private readonly search: SearchService) {}

  @Query(() => [UserEntity], {
    name: 'searchUsers',
    description: 'جستجوی کاربر بر اساس username یا fullName',
  })
  async searchUsers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<UserEntity[]> {
    return this.search.searchUsers(query, limit);
  }

  @Query(() => [PostEntity], {
    name: 'searchPosts',
    description: 'جستجوی پست‌ها (غیر Reel) بر اساس caption — بایگانی‌شده‌ها حذف می‌شوند',
  })
  async searchPosts(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.search.searchPosts(query, limit);
  }

  @Query(() => [PostEntity], {
    name: 'searchReels',
    description: 'جستجوی Reelها بر اساس caption — بایگانی‌شده‌ها حذف می‌شوند',
  })
  async searchReels(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.search.searchReels(query, limit);
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
  async searchAll(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<SearchResponse> {
    return this.search.searchAll(query, limit);
  }
}
