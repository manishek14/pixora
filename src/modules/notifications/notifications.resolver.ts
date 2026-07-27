import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationListResult } from './notification-list-result';
import { NotificationEntity } from './entities/notification.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => NotificationEntity)
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Query(() => NotificationListResult, {
    name: 'myNotifications',
    description: 'لیست نوتیفیکیشن‌های کاربر فعلی (جدیدترین اول)',
  })
  @UseGuards(GqlAuthGuard)
  async myNotifications(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
    @Args('onlyUnread', { nullable: true, defaultValue: false }) onlyUnread: boolean,
  ): Promise<NotificationListResult> {
    return this.notifications.list(user.id, limit, offset, onlyUnread);
  }

  @Query(() => Int, {
    name: 'myUnreadNotificationsCount',
    description: 'تعداد نوتیفیکیشن‌های خوانده‌نشده کاربر فعلی',
  })
  @UseGuards(GqlAuthGuard)
  async myUnreadNotificationsCount(@CurrentUser() user: UserEntity): Promise<number> {
    return this.notifications.getUnreadCount(user.id);
  }

  @Mutation(() => NotificationEntity, {
    name: 'markNotificationRead',
    description: 'علامت‌گذاری یک نوتیفیکیشن به‌عنوان خوانده‌شده',
  })
  @UseGuards(GqlAuthGuard)
  async markNotificationRead(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NotificationEntity> {
    return this.notifications.markAsRead(user.id, id);
  }

  @Mutation(() => Int, {
    name: 'markAllNotificationsRead',
    description: 'علامت‌گذاری همه نوتیفیکیشن‌ها به‌عنوان خوانده‌شده. برمی‌گرداند: تعداد آپدیت‌شده',
  })
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsRead(@CurrentUser() user: UserEntity): Promise<number> {
    return this.notifications.markAllAsRead(user.id);
  }

  @Mutation(() => Boolean, {
    name: 'deleteNotification',
    description: 'حذف یک نوتیفیکیشن از لیست کاربر فعلی',
  })
  @UseGuards(GqlAuthGuard)
  async deleteNotification(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.notifications.delete(user.id, id);
  }
}
