import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { StoryEntity } from '../entities/story.entity';

/**
 * A user + all their active stories, used by the stories feed.
 * `hasUnviewed` is true when at least one story in the group hasn't been
 * viewed by the current user (drives the "blue ring" indicator on the client).
 */
@ObjectType('UserStoriesGroup')
export class UserStoriesGroup {
  @Field(() => ID)
  userId: string;

  @Field(() => UserEntity)
  user: UserEntity;

  @Field(() => [StoryEntity])
  stories: StoryEntity[];

  @Field(() => Int)
  storiesCount: number;

  @Field()
  hasUnviewed: boolean;
}
