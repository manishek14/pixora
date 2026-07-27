import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { PushService } from './push.service';
import { PushResolver } from './push.resolver';
import { SubscribePushResult, UnsubscribePushResult } from './dto/push-results';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscriptionEntity])],
  providers: [
    PushService,
    PushResolver,
    SubscribePushResult,
    UnsubscribePushResult,
  ],
  exports: [PushService],
})
export class PushModule {}
