import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsUUID()
  postId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
