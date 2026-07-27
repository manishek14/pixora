import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MutesService } from './mutes.service';
import { MuteEntity } from './mute.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => MuteEntity)
export class MutesResolver {
  constructor(private readonly mutes: MutesService) {}

  @Query(() => [MuteEntity], {
    name: 'myMutes',
    description: 'فهرست کاربرانی که میوت کرده‌اید (پست یا استوری)',
  })
  @UseGuards(GqlAuthGuard)
  async myMutes(@CurrentUser() user: UserEntity): Promise<MuteEntity[]> {
    return this.mutes.listMutedBy(user.id);
  }

  @Query(() => Boolean, {
    name: 'isMuted',
    description: 'آیا کاربر فعلی، کاربر مشخص‌شده را میوت کرده است؟',
  })
  @UseGuards(GqlAuthGuard)
  async isMuted(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    const mute = await this.mutes.getMute(user.id, userId);
    return !!mute;
  }

  @Mutation(() => MuteEntity, {
    name: 'muteUser',
    description: 'میوت کردن پست یا استوری یک کاربر (یا هر دو)',
  })
  @UseGuards(GqlAuthGuard)
  async muteUser(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('mutePosts', { type: () => Boolean, nullable: true, defaultValue: true })
    mutePosts: boolean,
    @Args('muteStories', { type: () => Boolean, nullable: true, defaultValue: true })
    muteStories: boolean,
  ): Promise<MuteEntity> {
    return this.mutes.mute(user.id, userId, mutePosts, muteStories);
  }

  @Mutation(() => Boolean, {
    name: 'unmuteUser',
    description: 'رفع میوت از یک کاربر (هم پست و هم استوری)',
  })
  @UseGuards(GqlAuthGuard)
  async unmuteUser(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.mutes.unmute(user.id, userId);
  }
}
