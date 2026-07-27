import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { HighlightEntity } from './entities/highlight.entity';
import { CreateHighlightInput } from './dto/create-highlight.input';
import { UpdateHighlightInput } from './dto/update-highlight.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => HighlightEntity)
export class HighlightsResolver {
  constructor(private readonly highlightsService: HighlightsService) {}

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  @Query(() => [HighlightEntity], {
    description: 'هایلایت\u200cهای یک کاربر (عمومی)',
  })
  @UseGuards(GqlAuthGuard)
  async highlightsByUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<HighlightEntity[]> {
    return this.highlightsService.getByUser(userId);
  }

  @Query(() => HighlightEntity, {
    description: 'یک هایلایت بر اساس id',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async highlight(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HighlightEntity | null> {
    return this.highlightsService.getById(id);
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  @Mutation(() => HighlightEntity, {
    description: 'ایجاد هایلایت جدید با آیتم\u200cهای مشخص\u200cشده',
  })
  @UseGuards(GqlAuthGuard)
  async createHighlight(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreateHighlightInput,
  ): Promise<HighlightEntity> {
    return this.highlightsService.create(user.id, input);
  }

  @Mutation(() => HighlightEntity, {
    description: 'ساخت هایلایت از روی استوری\u200cهای خودم — مدیا از استوری کپی می\u200cشود تا هایلایت بعد از انقضای استوری باقی بماند',
  })
  @UseGuards(GqlAuthGuard)
  async createHighlightFromStories(
    @CurrentUser() user: UserEntity,
    @Args('title') title: string,
    @Args('storyIds', { type: () => [ID] }) storyIds: string[],
    @Args('coverUrl', { nullable: true }) coverUrl?: string,
  ): Promise<HighlightEntity> {
    return this.highlightsService.createFromStories(
      user.id,
      title,
      storyIds,
      coverUrl,
    );
  }

  @Mutation(() => HighlightEntity, {
    description: 'ویرایش هایلایت خودم (عنوان/کاور/آیتم\u200cها)',
  })
  @UseGuards(GqlAuthGuard)
  async updateHighlight(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateHighlightInput,
  ): Promise<HighlightEntity> {
    return this.highlightsService.update(user.id, id, input);
  }

  @Mutation(() => Boolean, {
    description: 'حذف هایلایت خودم',
  })
  @UseGuards(GqlAuthGuard)
  async deleteHighlight(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.highlightsService.delete(user.id, id);
  }
}
