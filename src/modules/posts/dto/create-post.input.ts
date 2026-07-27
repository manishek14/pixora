import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  mediaUrls: string[];

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isReel?: boolean;
}
