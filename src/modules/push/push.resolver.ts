import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { SubscribePushInput } from './dto/subscribe-push.input';
import { SubscribePushResult, UnsubscribePushResult } from './dto/push-results';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => PushSubscriptionEntity)
export class PushResolver {
  constructor(private readonly push: PushService) {}

  @Query(() => [PushSubscriptionEntity], {
    name: 'myPushSubscriptions',
    description: 'لیست دستگاه‌هایی که برای دریافت نوتیفیکیشن push ثبت شده‌اند',
  })
  @UseGuards(GqlAuthGuard)
  async myPushSubscriptions(
    @CurrentUser() user: UserEntity,
  ): Promise<PushSubscriptionEntity[]> {
    return this.push.listForUser(user.id);
  }

  @Mutation(() => SubscribePushResult, {
    name: 'subscribeToPush',
    description: 'ثبت یک دستگاه برای دریافت نوتیفیکیشن push (Web Push API)',
  })
  @UseGuards(GqlAuthGuard)
  async subscribeToPush(
    @CurrentUser() user: UserEntity,
    @Args('input') input: SubscribePushInput,
  ): Promise<SubscribePushResult> {
    const { subscription, created } = await this.push.subscribe(user.id, input);
    return { subscription, created };
  }

  @Mutation(() => UnsubscribePushResult, {
    name: 'unsubscribeFromPush',
    description: 'حذف یک دستگاه از لیست push با endpoint',
  })
  @UseGuards(GqlAuthGuard)
  async unsubscribeFromPush(
    @CurrentUser() user: UserEntity,
    @Args('endpoint') endpoint: string,
  ): Promise<UnsubscribePushResult> {
    const removed = await this.push.unsubscribe(user.id, endpoint);
    return { removed };
  }

  @Mutation(() => UnsubscribePushResult, {
    name: 'unsubscribeAllPush',
    description: 'حذف همه دستگاه‌های کاربر فعلی از push (مثلاً برای خروج کامل)',
  })
  @UseGuards(GqlAuthGuard)
  async unsubscribeAllPush(
    @CurrentUser() user: UserEntity,
  ): Promise<UnsubscribePushResult> {
    const removed = await this.push.unsubscribeAll(user.id);
    return { removed };
  }
}
