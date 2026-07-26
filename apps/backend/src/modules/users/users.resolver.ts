import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => UserEntity, { description: 'دریافت کاربر با شناسه' })
  async user(@Args('id') id: string): Promise<UserEntity> {
    return this.users.findById(id);
  }

  @Query(() => UserEntity, { description: 'دریافت کاربر با نام کاربری' })
  async userByUsername(@Args('username') username: string): Promise<UserEntity> {
    return this.users.findByUsername(username);
  }

  @Query(() => [UserEntity], { description: 'جستجوی کاربران' })
  async searchUsers(
    @Args('q') q: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<UserEntity[]> {
    return this.users.search(q, limit);
  }

  @Mutation(() => UserEntity, { description: 'بروزرسانی پروفایل' })
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @CurrentUser() user: UserEntity,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserEntity> {
    return this.users.updateProfile(user.id, input);
  }

  @Mutation(() => UserEntity, { description: 'بروزرسانی آواتار' })
  @UseGuards(GqlAuthGuard)
  async updateAvatar(
    @CurrentUser() user: UserEntity,
    @Args('url') url: string,
  ): Promise<UserEntity> {
    return this.users.updateAvatar(user.id, url);
  }
}
