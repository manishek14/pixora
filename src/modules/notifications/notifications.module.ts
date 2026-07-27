import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationListResult } from './notification-list-result';
import { RealtimeModule } from '../realtime/realtime.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    RealtimeModule,
    PushModule,
  ],
  providers: [NotificationsService, NotificationsResolver, NotificationListResult],
  exports: [NotificationsService],
})
export class NotificationsModule {}
