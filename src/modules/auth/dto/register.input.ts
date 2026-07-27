import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'username can only contain letters, numbers, underscore and dot',
  })
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72)
  // Strong password: at least one lowercase, one uppercase, one digit, one special char.
  // The full regex is also enforced client-side for nicer UX, but server-side is the source of truth.
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
  })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}
