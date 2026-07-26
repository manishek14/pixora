import { Args, Context, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowEntity } from './follow.entity';
import { FollowsService } from './follows.service';
import { UserEntity } from '../users/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserEntity)
export class FollowsResolver {
  constructor(private readonly followsService: FollowsService) {}

  @Mutation(() => Boolean, { description: 'فالو کردن کاربر' })
  @UseGuards(GqlAuthGuard)
  async followUser(
    @CurrentUser() user: UserEntity,
    @Args('userId') targetId: string,
  ): Promise<boolean> {
    await this.followsService.follow(user.id, targetId);
    return true;
  }

  @Mutation(() => Boolean, { description: 'آنفالو کردن کاربر' })
  @UseGuards(GqlAuthGuard)
  async unfollowUser(
    @CurrentUser() user: UserEntity,
    @Args('userId') targetId: string,
  ): Promise<boolean> {
    return this.followsService.unfollow(user.id, targetId);
  }

  @Mutation(() => Boolean, { description: 'حذف فالوور از لیست خود' })
  @UseGuards(GqlAuthGuard)
  async removeFollower(
    @CurrentUser() user: UserEntity,
    @Args('followerId') followerId: string,
  ): Promise<boolean> {
    return this.followsService.removeFollower(user.id, followerId);
  }

  @Query(() => Boolean, { description: 'آیا فالو می‌کند؟' })
  @UseGuards(GqlAuthGuard)
  async isFollowing(
    @CurrentUser() user: UserEntity,
    @Args('userId') targetId: string,
  ): Promise<boolean> {
    return this.followsService.isFollowing(user.id, targetId);
  }

  @Query(() => [UserEntity], { description: 'لیست فالوورها' })
  async followers(@Args('userId') userId: string): Promise<UserEntity[]> {
    return this.followsService.getFollowers(userId);
  }

  @Query(() => [UserEntity], { description: 'لیست فالووینگ‌ها' })
  async following(@Args('userId') userId: string): Promise<UserEntity[]> {
    return this.followsService.getFollowing(userId);
  }

  @Mutation(() => Boolean, { description: 'افزودن/حذف به کلوزفرندز' })
  @UseGuards(GqlAuthGuard)
  async toggleCloseFriend(
    @CurrentUser() user: UserEntity,
    @Args('userId') targetId: string,
    @Args('isClose') isClose: boolean,
  ): Promise<boolean> {
    await this.followsService.toggleCloseFriend(user.id, targetId, isClose);
    return true;
  }

  @Query(() => [UserEntity], { description: 'کلوزفرندز من' })
  @UseGuards(GqlAuthGuard)
  async myCloseFriends(@CurrentUser() user: UserEntity): Promise<UserEntity[]> {
    return this.followsService.getCloseFriends(user.id);
  }
}
