import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlockEntity } from './block.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => BlockEntity)
export class BlocksResolver {
  constructor(private readonly blocks: BlocksService) {}

  @Query(() => [BlockEntity], {
    name: 'myBlocks',
    description: 'فهرست کاربرانی که بلاک کرده‌اید (جدیدترین در ابتدا)',
  })
  @UseGuards(GqlAuthGuard)
  async myBlocks(@CurrentUser() user: UserEntity): Promise<BlockEntity[]> {
    return this.blocks.listBlockedBy(user.id);
  }

  @Query(() => Boolean, {
    name: 'isBlocked',
    description: 'آیا کاربر فعلی، کاربر مشخص‌شده را بلاک کرده است؟',
  })
  @UseGuards(GqlAuthGuard)
  async isBlocked(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.blocks.isBlocking(user.id, userId);
  }

  @Mutation(() => BlockEntity, {
    name: 'blockUser',
    description: 'بلاک کردن یک کاربر (هر گونه فالو در هر دو جهت حذف می‌شود)',
  })
  @UseGuards(GqlAuthGuard)
  async blockUser(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<BlockEntity> {
    return this.blocks.block(user.id, userId);
  }

  @Mutation(() => Boolean, {
    name: 'unblockUser',
    description: 'رفع بلاک از یک کاربر',
  })
  @UseGuards(GqlAuthGuard)
  async unblockUser(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.blocks.unblock(user.id, userId);
  }
}
