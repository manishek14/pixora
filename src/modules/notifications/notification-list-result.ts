import { Field, Int, ObjectType } from '@nestjs/graphql';
import { NotificationEntity } from './entities/notification.entity';

@ObjectType()
export class NotificationListResult {
  @Field(() => [NotificationEntity])
  items: NotificationEntity[];

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  unreadCount: number;
}
