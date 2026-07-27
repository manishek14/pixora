import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserEntity } from '../users/user.entity';

/**
 * A single follow suggestion. The `reason` is a short Persian hint string
 * (e.g. "دنبال‌کنندگان مشترک: ۳ نفر") the client can render to explain why
 * the suggestion was made. `mutualCount` is the raw mutual-followers count.
 */
@ObjectType('SuggestionItem')
export class SuggestionItem {
  @Field(() => UserEntity)
  user: UserEntity;

  @Field(() => Int)
  mutualCount: number;

  @Field()
  reason: string;
}

@ObjectType('SuggestionListResult')
export class SuggestionListResult {
  @Field(() => [SuggestionItem])
  items: SuggestionItem[];

  @Field(() => Int)
  total: number;
}
