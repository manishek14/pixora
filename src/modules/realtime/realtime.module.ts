import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEvents } from './realtime.events';
import { PresenceService } from './presence.service';
import { PresenceResolver } from './presence.resolver';
import { MessageThreadEntity } from '../messages/entities/message-thread.entity';
import { FollowEntity } from '../follows/follow.entity';
import { OnlineStatus } from './dto/online-status';

/**
 * RealtimeModule — Socket.io gateway + presence tracker + typed event bus.
 *
 * Other modules that want to emit realtime events import this module and
 * inject `RealtimeEvents`. They never touch the raw Socket.io server.
 *
 * The gateway also depends on JwtModule (via AuthModule) for verifying
 * connection tokens.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MessageThreadEntity, FollowEntity]),
    JwtModule.registerAsync({
      useFactory: () => ({ secret: process.env.JWT_ACCESS_SECRET }),
    }),
  ],
  providers: [RealtimeGateway, RealtimeEvents, PresenceService, PresenceResolver, OnlineStatus],
  exports: [RealtimeEvents, PresenceService],
})
export class RealtimeModule {}
