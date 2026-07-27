import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HighlightItemInput } from './create-highlight.input';

@InputType('UpdateHighlightInput')
export class UpdateHighlightInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  coverUrl?: string;

  @Field(() => [HighlightItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightItemInput)
  items?: HighlightItemInput[];
}
