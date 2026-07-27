import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, MaxLength, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class SendMessageInput {
  /** The recipient user — service looks up (or creates) the thread. */
  @Field()
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  mediaUrls?: string[];
}
