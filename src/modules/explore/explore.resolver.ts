import { Args, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import {
  ExplorePostsResult,
  HashtagTrend,
  SuggestedUser,
} from './explore-types';
import { PostEntity } from '../posts/post.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver()
export class ExploreResolver {
  constructor(private readonly explore: ExploreService) {}

  @Query(() => ExplorePostsResult, {
    name: 'exploreTrending',
    description: 'فید اکسپلور (پست و ریلز محبوب بر اساس امتیاز تعامل)',
  })
  async exploreTrending(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<ExplorePostsResult> {
    return this.explore.getExploreFeed(limit, offset);
  }

  @Query(() => [PostEntity], {
    name: 'trendingReels',
    description: 'ریلزهای ترند هفته اخیر',
  })
  async trendingReels(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.explore.getTrendingReels(limit);
  }

  @Query(() => [PostEntity], {
    name: 'trendingPosts',
    description: 'پست‌های محبوب هفته اخیر',
  })
  async trendingPosts(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PostEntity[]> {
    return this.explore.getTrendingPosts(limit);
  }

  @Query(() => [HashtagTrend], {
    name: 'trendingHashtags',
    description: 'هشتگ‌های ترند هفته اخیر',
  })
  async trendingHashtags(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<HashtagTrend[]> {
    return this.explore.getTrendingHashtags(limit);
  }

  @Query(() => [SuggestedUser], {
    name: 'suggestedUsers',
    description: 'پیشنهاد فالو بر اساس فالوورهای مشترک',
  })
  @UseGuards(GqlAuthGuard)
  async suggestedUsers(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<SuggestedUser[]> {
    return this.explore.getSuggestedUsers(user.id, limit);
  }
}
