import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEntity } from './follow.entity';
import { UserEntity } from '../users/user.entity';
import { FollowsService } from './follows.service';
import { FollowsResolver } from './follows.resolver';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowEntity, UserEntity]),
    AuthModule,
    NotificationsModule,
  ],
  providers: [FollowsService, FollowsResolver],
  exports: [FollowsService],
})
export class FollowsModule {}
