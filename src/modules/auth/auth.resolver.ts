import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh.input';
import { AuthPayload } from './dto/auth-payload';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload, { description: 'ثبت‌نام کاربر جدید' })
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.auth.register(input);
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'ورود کاربر' })
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.auth.login(input);
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'تمدید توکن با refresh token' })
  async refresh(@Args('input') input: RefreshTokenInput): Promise<AuthPayload> {
    return this.auth.refresh(input.refreshToken);
  }

  @Mutation(() => Boolean, { description: 'خروج و ابطال refresh token' })
  @UseGuards(GqlAuthGuard)
  async logout(@CurrentUser() user: UserEntity): Promise<boolean> {
    return this.auth.logout(user.id);
  }

  @Query(() => UserEntity, { description: 'کاربر فعلی' })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return user;
  }
}
