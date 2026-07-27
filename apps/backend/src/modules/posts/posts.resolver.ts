import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostEntity } from './post.entity';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(private readonly posts: PostsService) {}

  @Query(() => PostEntity, { description: 'دریافت یک پست با شناسه' })
  async post(@Args('id') id: string): Promise<PostEntity> {
    return this.posts.findById(id);
  }

  @Query(() => [PostEntity], { description: 'پست‌های یک کاربر' })
  async postsByUser(
    @Args('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PostEntity[]> {
    return this.posts.findByAuthor(userId, limit, offset);
  }

  @Query(() => [PostEntity], { description: 'پست‌های یک هشتگ' })
  async postsByHashtag(
    @Args('tag') tag: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PostEntity[]> {
    return this.posts.findByHashtag(tag, limit, offset);
  }

  @Mutation(() => PostEntity, { description: 'ساخت پست جدید' })
  @UseGuards(GqlAuthGuard)
  async createPost(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreatePostInput,
  ): Promise<PostEntity> {
    return this.posts.create(user.id, input);
  }

  @Mutation(() => PostEntity, { description: 'ویرایش پست' })
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @CurrentUser() user: UserEntity,
    @Args('id') id: string,
    @Args('input') input: UpdatePostInput,
  ): Promise<PostEntity> {
    return this.posts.update(id, user.id, input);
  }

  @Mutation(() => Boolean, { description: 'حذف پست' })
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @CurrentUser() user: UserEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.posts.delete(id, user.id);
  }

  @Mutation(() => PostEntity, { description: 'آرشیو/بازگردانی پست' })
  @UseGuards(GqlAuthGuard)
  async toggleArchive(
    @CurrentUser() user: UserEntity,
    @Args('id') id: string,
    @Args('archive') archive: boolean,
  ): Promise<PostEntity> {
    return this.posts.archive(id, user.id, archive);
  }
}
