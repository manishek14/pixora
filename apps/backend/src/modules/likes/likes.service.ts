import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
    private readonly postsService: PostsService,
  ) {}

  async toggle(userId: string, postId: string): Promise<boolean> {
    // Ensure post exists
    await this.postsService.findById(postId);

    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postsService.decrementLikes(postId);
      return false; // unliked
    }

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    await this.postsService.incrementLikes(postId);
    return true; // liked
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const like = await this.likeRepo.findOne({ where: { userId, postId } });
    return !!like;
  }

  async getLikers(postId: string): Promise<LikeEntity[]> {
    return this.likeRepo.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async countByPost(postId: string): Promise<number> {
    return this.likeRepo.count({ where: { postId } });
  }
}
