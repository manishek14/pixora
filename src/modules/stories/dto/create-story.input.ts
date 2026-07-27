import { Field, InputType } from '@nestjs/graphql';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { StoryMediaType, StoryVisibility } from '../entities/story.entity';

@InputType('CreateStoryInput')
export class CreateStoryInput {
  @Field()
  @IsString()
  @IsUrl()
  mediaUrl: string;

  @Field(() => StoryMediaType)
  @IsIn([StoryMediaType.Image, StoryMediaType.Video])
  mediaType: StoryMediaType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @Field(() => StoryVisibility, { nullable: true, defaultValue: StoryVisibility.Public })
  @IsOptional()
  @IsIn([StoryVisibility.Public, StoryVisibility.CloseFriends])
  visibility?: StoryVisibility;
}
