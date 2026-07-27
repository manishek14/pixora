import { Field, Int, ObjectType } from '@nestjs/graphql';
import { MessageThreadEntity } from './entities/message-thread.entity';

/**
 * A user's thread list — the most recent message of each thread is
 * pre-fetched so the client can render a preview (like Instagram's DM
 * inbox row).
 */
@ObjectType()
export class ThreadListResult {
  @Field(() => [MessageThreadEntity])
  items: MessageThreadEntity[];

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  unreadCount: number;
}
