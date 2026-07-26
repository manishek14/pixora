// src/modules/posts/post.resolver.ts
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Posts } from './post.entity';
import { PostService } from './post.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Resolver(() => Posts)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Query(() => [Posts], {
    name: 'posts',
    description: 'دریافت لیست تمام پست ها',
  })
  findAll(): Posts[] {
    return this.postService.findAll();
  }

  @Query(() => Posts, {
    name: 'post',
    description: 'دریافت یک پست',
  })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.postService.findOne(id);
  }

  @Mutation(() => Posts, {
    name: 'createPost',
    description: 'ساخت یک پست',
  })
  create(@Args('input') input: CreatePostInput) {
    return this.postService.create(input);
  }

  @Mutation(() => Posts, {
    name: 'updatePost',
    description: 'ویرایش یک پست',
  })
  update(@Args('updateInput') updateInput: UpdatePostInput) {
    return this.postService.update(updateInput);
  }

  @Mutation(() => Boolean, {
    name: 'removePost',
    description: 'حذف یک پست',
  })
  remove(@Args('id', { type: () => ID }) id: string): boolean {
    return this.postService.remove(id);
  }
}