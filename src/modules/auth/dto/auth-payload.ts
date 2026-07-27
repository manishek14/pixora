import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';

@ObjectType()
export class AuthPayload {
  @Field(() => UserEntity)
  user: UserEntity;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
