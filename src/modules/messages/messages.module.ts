import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageThreadEntity } from './entities/message-thread.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/user.entity';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { ThreadListResult } from './thread-list-result';
import { BlocksModule } from '../blocks/blocks.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageThreadEntity, MessageEntity, UserEntity]),
    BlocksModule,
    RealtimeModule,
    PushModule,
  ],
  providers: [MessagesService, MessagesResolver, ThreadListResult],
  exports: [MessagesService],
})
export class MessagesModule {}
