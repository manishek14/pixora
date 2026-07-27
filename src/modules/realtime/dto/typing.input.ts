import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsBoolean, IsOptional } from 'class-validator';

/**
 * Sent by the client over Socket.io when the user starts/stops typing in a
 * thread. The gateway verifies the sender is a participant and forwards the
 * event to the other participant.
 */
@InputType()
export class TypingInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  threadId: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isTyping?: boolean;
}
