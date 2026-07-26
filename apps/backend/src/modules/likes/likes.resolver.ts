import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LikeEntity } from './like.entity';
import { LikesService } from './likes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => LikeEntity)
export class LikesResolver {
  constructor(private readonly likes: LikesService) {}

  @Mutation(() => Boolean, {
    description: 'لایک/آنلایک پست (toggle). true = لایک شد، false = آنلایک شد',
  })
  @UseGuards(GqlAuthGuard)
  async toggleLike(
    @CurrentUser() user: UserEntity,
    @Args('postId') postId: string,
  ): Promise<boolean> {
    return this.likes.toggle(user.id, postId);
  }

  @Query(() => Boolean, { description: 'آیا کاربر پست را لایک کرده؟' })
  @UseGuards(GqlAuthGuard)
  async isLiked(
    @CurrentUser() user: UserEntity,
    @Args('postId') postId: string,
  ): Promise<boolean> {
    return this.likes.isLiked(user.id, postId);
  }

  @Query(() => [LikeEntity], { description: 'لیست لایک‌کنندگان پست' })
  async likers(@Args('postId') postId: string): Promise<LikeEntity[]> {
    return this.likes.getLikers(postId);
  }
}
