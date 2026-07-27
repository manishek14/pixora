import { Args, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { OnlineStatus } from './dto/online-status';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => OnlineStatus)
export class PresenceResolver {
  constructor(private readonly presence: PresenceService) {}

  /**
   * Get the online status of one or more users. Pass a list of user IDs
   * (e.g. your DM partners or followings) and get back their current
   * online/offline state plus a last-seen timestamp.
   */
  @Query(() => [OnlineStatus], {
    name: 'onlineStatus',
    description:
      'وضعیت آنلاین/آفلاین یک یا چند کاربر — برای نمایش نقطه سبز کنار نام کاربر',
  })
  @UseGuards(GqlAuthGuard)
  async onlineStatus(
    @CurrentUser() _user: UserEntity,
    @Args('userIds', { type: () => [ID] }) userIds: string[],
  ): Promise<OnlineStatus[]> {
    return this.presence
      .getOnlineStatus(userIds)
      .map((s) => ({ ...s, lastSeenAt: Math.max(0, s.lastSeenAt) }));
  }
}
