import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Online status of a user — returned by the `onlineStatus` GraphQL query.
 *
 * `lastSeenAt` is a millisecond-epoch timestamp; if the user has never been
 * seen online during this server's lifetime, it is 0.
 */
@ObjectType()
export class OnlineStatus {
  @Field(() => ID)
  userId: string;

  @Field()
  isOnline: boolean;

  @Field()
  lastSeenAt: number;
}
