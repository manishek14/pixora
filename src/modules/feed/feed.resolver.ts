import { Args, Query, Resolver, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedResult } from './feed-result';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { OptionalGqlAuthGuard } from '../auth/guards/optional-gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => FeedResult)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => FeedResult, { description: 'فید شخصی کاربر (پست‌های فالووینگ + خودش)' })
  @UseGuards(GqlAuthGuard)
  async feed(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<FeedResult> {
    return this.feedService.getFeed(user.id, limit, offset);
  }

  /**
   * Explore feed — public endpoint. If the request carries a valid JWT,
   * we use the viewer's id to filter out posts from muted/blocked authors.
   * Otherwise (anonymous), we just return the global trending list.
   */
  @Query(() => FeedResult, { description: 'فید اکسپلور (پست‌های محبوب و جدید همه)' })
  @UseGuards(OptionalGqlAuthGuard)
  async exploreFeed(
    @Context() ctx: { req?: { user?: { id: string } } },
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<FeedResult> {
    const userId = ctx.req?.user?.id ?? null;
    return this.feedService.getExploreFeed(userId, limit, offset);
  }
}
