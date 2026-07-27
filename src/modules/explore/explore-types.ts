import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PostEntity } from '../posts/post.entity';
import { UserEntity } from '../users/user.entity';

@ObjectType()
export class ExplorePostsResult {
  @Field(() => [PostEntity])
  items: PostEntity[];

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class HashtagTrend {
  @Field()
  tag: string;

  @Field(() => Int)
  postsCount: number;

  @Field(() => Int)
  reelsCount: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class SuggestedUser {
  @Field(() => UserEntity)
  user: UserEntity;

  @Field(() => Int)
  mutualFollowers: number;

  @Field(() => Int)
  postsCount: number;
}
