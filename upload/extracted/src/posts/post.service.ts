// src/modules/posts/post.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Posts } from './post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Injectable()
export class PostService {
  private posts: Posts[] = [
    {
      id: '1',
      title: 'اولین پست من',
      content: 'wellcome to my first project.',
      published: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'دومین پست من',
      content: 'wellcome to my second project.',
      published: true,
      createdAt: new Date().toISOString(),
    },
  ];

  findAll(): Posts[] {
    return this.posts;
  }

  findOne(id: string): Posts {
    const post = this.posts.find((post) => post.id === id);
    if (!post) {
      throw new NotFoundException(`پستی با شناسه ${id} پیدا نشد`);
    }
    return post;
  }

  create(input: CreatePostInput) {
    const newPost: Posts = {
      id: Date.now().toString(),
      title: input.title,
      content: input.content,
      author: input.author,
      published: input.published || false,
      createdAt: new Date().toISOString(),
    };

    this.posts.push(newPost);
    return newPost;
  }

  update(updateInput: UpdatePostInput): Posts {
    const index = this.posts.findIndex((post) => post.id === updateInput.id);

    if (index === -1) {
      throw new NotFoundException(`پستی با شناسه ${updateInput.id} پیدا نشد!`);
    }

    const updatedPost: Posts = {
      ...this.posts[index],
      ...updateInput,
      updatedAt: new Date().toISOString(),
    };

    this.posts[index] = updatedPost;
    return updatedPost;
  }

  remove(id: string): boolean {
    const index = this.posts.findIndex((post) => post.id === id);

    if (index === -1) {
      throw new NotFoundException(`پستی با شناسه ${id} پیدا نشد!`);
    }

    this.posts.splice(index, 1);
    return true;
  }
}