import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType('CreateReelInput')
export class CreateReelInput {
  @Field()
  @IsUrl()
  @MaxLength(512)
  videoUrl: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  audioTrack?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600) // 10 minutes max
  durationSeconds?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 2200)
  caption?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
