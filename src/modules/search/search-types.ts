import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';

/**
 * One row in a hashtag search — a hashtag plus how many posts+reels use it.
 */
@ObjectType()
export class HashtagSearchResult {
  @Field()
  tag: string;

  @Field(() => Int)
  postsCount: number;

  @Field(() => Int)
  reelsCount: number;

  @Field(() => Int)
  total: number;
}

/**
 * Top-level union result for the unified `search` query — returns users,
 * posts, reels, and hashtags matching the query in one call.
 */
@ObjectType()
export class SearchResponse {
  @Field(() => [UserEntity])
  users: UserEntity[];

  @Field(() => [PostEntity])
  posts: PostEntity[];

  @Field(() => [PostEntity])
  reels: PostEntity[];

  @Field(() => [HashtagSearchResult])
  hashtags: HashtagSearchResult[];
}
