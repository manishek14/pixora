import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentEntity } from './comment.entity';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [CommentEntity], { description: 'کامنت‌های یک پست با پاسخ‌ها' })
  async comments(@Args('postId') postId: string): Promise<CommentEntity[]> {
    return this.commentsService.findByPost(postId);
  }

  @Mutation(() => CommentEntity, { description: 'ثبت کامنت یا پاسخ' })
  @UseGuards(GqlAuthGuard)
  async createComment(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreateCommentInput,
  ): Promise<CommentEntity> {
    return this.commentsService.create(user.id, input);
  }

  @Mutation(() => CommentEntity, { description: 'ویرایش کامنت' })
  @UseGuards(GqlAuthGuard)
  async updateComment(
    @CurrentUser() user: UserEntity,
    @Args('id') id: string,
    @Args('text') text: string,
  ): Promise<CommentEntity> {
    return this.commentsService.update(id, user.id, text);
  }

  @Mutation(() => Boolean, { description: 'حذف کامنت' })
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @CurrentUser() user: UserEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.commentsService.delete(id, user.id);
  }
}
