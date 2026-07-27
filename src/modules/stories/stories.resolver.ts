import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoryEntity } from './entities/story.entity';
import { StoryViewEntity } from './entities/story-view.entity';
import { CreateStoryInput } from './dto/create-story.input';
import { UserStoriesGroup } from './types/user-stories-group';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => StoryEntity)
export class StoriesResolver {
  constructor(private readonly storiesService: StoriesService) {}

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  @Query(() => [UserStoriesGroup], {
    description: 'فید استوری: استوری\u200cهای فعال خودم + کاربرانی که فالو می\u200cکنم، گروه\u200cبندی شده بر اساس نویسنده',
  })
  @UseGuards(GqlAuthGuard)
  async storiesFeed(@CurrentUser() user: UserEntity): Promise<UserStoriesGroup[]> {
    return this.storiesService.getFeed(user.id);
  }

  @Query(() => [StoryEntity], {
    description: 'استوری\u200cهای فعال یک کاربر (در صورت مجاز بودن مشاهده)',
  })
  @UseGuards(GqlAuthGuard)
  async userStories(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<StoryEntity[]> {
    return this.storiesService.getActiveByUser(user.id, userId);
  }

  @Query(() => StoryEntity, {
    description: 'یک استوری بر اساس id (در صورت مجاز بودن مشاهده)',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async story(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<StoryEntity | null> {
    return this.storiesService.getById(user.id, id);
  }

  @Query(() => [StoryViewEntity], {
    description: 'لیست مشاهده\u200cکنندگان یکی از استوری\u200cهای خودم (فقط نویسنده)',
  })
  @UseGuards(GqlAuthGuard)
  async storyViewers(
    @CurrentUser() user: UserEntity,
    @Args('storyId', { type: () => ID }) storyId: string,
  ): Promise<StoryViewEntity[]> {
    return this.storiesService.getViewers(user.id, storyId);
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  @Mutation(() => StoryEntity, {
    description: 'ایجاد استوری جدید (انقضا: ۲۴ ساعت)',
  })
  @UseGuards(GqlAuthGuard)
  async createStory(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreateStoryInput,
  ): Promise<StoryEntity> {
    return this.storiesService.create(user.id, input);
  }

  @Mutation(() => Boolean, {
    description: 'حذف استوری خودم',
  })
  @UseGuards(GqlAuthGuard)
  async deleteStory(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.storiesService.delete(user.id, id);
  }

  @Mutation(() => StoryEntity, {
    description: 'علامت\u200cگذاری استوری به عنوان دیده\u200cشده (idempotent)',
  })
  @UseGuards(GqlAuthGuard)
  async viewStory(
    @CurrentUser() user: UserEntity,
    @Args('storyId', { type: () => ID }) storyId: string,
  ): Promise<StoryEntity> {
    return this.storiesService.view(user.id, storyId);
  }

  @Mutation(() => StoryEntity, {
    description: 'واکنش (emoji) به استوری — یک واکنش برای هر کاربر/استوری، آپدیت جایگزین می\u200cکند',
  })
  @UseGuards(GqlAuthGuard)
  async reactToStory(
    @CurrentUser() user: UserEntity,
    @Args('storyId', { type: () => ID }) storyId: string,
    @Args('emoji') emoji: string,
  ): Promise<StoryEntity> {
    return this.storiesService.react(user.id, storyId, emoji);
  }

  @Mutation(() => Boolean, {
    description: 'حذف واکنش به استوری',
  })
  @UseGuards(GqlAuthGuard)
  async removeStoryReaction(
    @CurrentUser() user: UserEntity,
    @Args('storyId', { type: () => ID }) storyId: string,
  ): Promise<boolean> {
    return this.storiesService.removeReaction(user.id, storyId);
  }
}
