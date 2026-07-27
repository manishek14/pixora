import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PushSubscriptionEntity } from '../push-subscription.entity';

/**
 * Result of `subscribeToPush` — returns the stored subscription plus a
 * boolean indicating whether it was newly created or already existed
 * (idempotent subscribe).
 */
@ObjectType()
export class SubscribePushResult {
  @Field(() => PushSubscriptionEntity)
  subscription: PushSubscriptionEntity;

  @Field()
  created: boolean;
}

/**
 * Result of `unsubscribeFromPush` — returns the number of subscriptions
 * removed (0 if nothing matched).
 */
@ObjectType()
export class UnsubscribePushResult {
  @Field(() => Int)
  removed: number;
}
