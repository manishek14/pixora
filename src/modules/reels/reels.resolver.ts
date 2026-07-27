import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostEntity } from '../posts/post.entity';
import { ReelViewEntity } from './entities/reel-view.entity';
import { ReelsService } from './reels.service';
import { CreateReelInput } from './dto/create-reel.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => PostEntity)
export class ReelsResolver {
  constructor(private readonly reels: ReelsService) {}

  @Query(() => [PostEntity], {
    name: 'reelsFeed',
    description: 'فید ریلز ترند (مرتب بر اساس امتیاز تعامل + بازدید)',
  })
  @UseGuards(GqlAuthGuard)
  async reelsFeed(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PostEntity[]> {
    return this.reels.getFeed(user.id, limit, offset);
  }

  @Query(() => PostEntity, { name: 'reel', description: 'دریافت یک ریل با شناسه' })
  async reel(@Args('id', { type: () => ID }) id: string): Promise<PostEntity> {
    return this.reels.getById(id);
  }

  @Query(() => [PostEntity], {
    name: 'userReels',
    description: 'ریلزهای یک کاربر',
  })
  async userReels(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PostEntity[]> {
    return this.reels.getByUser(userId, limit, offset);
  }

  @Query(() => [PostEntity], {
    name: 'reelsByHashtag',
    description: 'ریلزهای یک هشتگ',
  })
  async reelsByHashtag(
    @Args('tag') tag: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PostEntity[]> {
    return this.reels.getByHashtag(tag, limit, offset);
  }

  @Query(() => [ReelViewEntity], {
    name: 'reelViewers',
    description: 'لیست بینندگان ریل (فقط نویسنده)',
  })
  @UseGuards(GqlAuthGuard)
  async reelViewers(
    @CurrentUser() user: UserEntity,
    @Args('reelId', { type: () => ID }) reelId: string,
  ): Promise<ReelViewEntity[]> {
    return this.reels.getViewers(user.id, reelId);
  }

  @Mutation(() => PostEntity, { name: 'createReel', description: 'ساخت ریل جدید' })
  @UseGuards(GqlAuthGuard)
  async createReel(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreateReelInput,
  ): Promise<PostEntity> {
    return this.reels.create(user.id, input);
  }

  @Mutation(() => PostEntity, {
    name: 'viewReel',
    description: 'ثبت بازدید ریل (ایدمپتنت — فقط اولین بازدید شمارش می‌شود)',
  })
  @UseGuards(GqlAuthGuard)
  async viewReel(
    @CurrentUser() user: UserEntity,
    @Args('reelId', { type: () => ID }) reelId: string,
  ): Promise<PostEntity> {
    return this.reels.view(user.id, reelId);
  }

  @Mutation(() => PostEntity, {
    name: 'shareReel',
    description: 'ثبت اشتراک‌گذاری ریل',
  })
  @UseGuards(GqlAuthGuard)
  async shareReel(@Args('reelId', { type: () => ID }) reelId: string): Promise<PostEntity> {
    return this.reels.share(reelId);
  }

  @Mutation(() => Boolean, { name: 'deleteReel', description: 'حذف ریل (فقط نویسنده)' })
  @UseGuards(GqlAuthGuard)
  async deleteReel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.reels.delete(id, user.id);
  }
}
