import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedResult } from './feed-result';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => FeedResult)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => FeedResult, { description: 'فید شخصی کاربر (پست‌های فالووینگ + خودش)' })
  @UseGuards(GqlAuthGuard)
  async feed(
    @CurrentUser() user: UserEntity,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<FeedResult> {
    return this.feedService.getFeed(user.id, limit, offset);
  }

  @Query(() => FeedResult, { description: 'فید اکسپلور (پست‌های محبوب و جدید همه)' })
  async exploreFeed(
    @Args('limit', { nullable: true, defaultValue: 30 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<FeedResult> {
    return this.feedService.getExploreFeed(limit, offset);
  }
}
