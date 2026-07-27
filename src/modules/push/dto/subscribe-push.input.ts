import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * Browser-side PushSubscription.toJSON() output — passed to the
 * `subscribeToPush` mutation. The client obtains this by calling
 * `serviceWorkerRegistration.pushManager.subscribe(...)` and serializing
 * the result.
 */
@InputType()
export class SubscribePushInput {
  /** The push service endpoint URL. */
  @Field()
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  /** P-256 public key (base64url). */
  @Field()
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  /** Auth secret (base64url). */
  @Field()
  @IsString()
  @IsNotEmpty()
  auth: string;

  /** Optional expiration time (ms epoch) — browsers may not send this. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2 ** 53 - 1)
  expirationTime?: number;
}
