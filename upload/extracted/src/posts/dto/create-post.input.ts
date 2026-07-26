// src/modules/posts/dto/create-post.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field(() => String, { description: 'عنوان پست' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'عنوان باید حداقل ۳ کاراکتر باشد' })
  title!: string;

  @Field(() => String, { description: 'محتوای پست' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'محتوای پست باید حداقل ۱۰ کاراکتر باشد' })
  content!: string;

  @Field(() => String, { description: 'نویسنده پست', nullable: true })
  @IsString()
  @IsOptional()
  author?: string;

  @Field(() => Boolean, { description: 'وضعیت انتشار', defaultValue: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}