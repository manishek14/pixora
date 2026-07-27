import { Field, ObjectType } from '@nestjs/graphql';
import { PostEntity } from '../posts/post.entity';

@ObjectType()
export class BookmarkListResult {
  @Field(() => [PostEntity])
  items: PostEntity[];

  @Field()
  hasMore: boolean;
}
