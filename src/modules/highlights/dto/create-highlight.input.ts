import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HighlightMediaType } from '../entities/highlight-item.entity';

@InputType('HighlightItemInput')
export class HighlightItemInput {
  @Field()
  @IsString()
  @IsUrl()
  mediaUrl: string;

  @Field(() => HighlightMediaType)
  @IsIn([HighlightMediaType.Image, HighlightMediaType.Video])
  mediaType: HighlightMediaType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  order?: number;
}

@InputType('CreateHighlightInput')
export class CreateHighlightInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  coverUrl?: string;

  @Field(() => [HighlightItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightItemInput)
  items: HighlightItemInput[];
}
