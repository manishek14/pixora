import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationEntityType,
} from '../notifications/entities/notification.entity';
import { BlocksService } from '../blocks/blocks.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
    private readonly postsService: PostsService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlocksService,
  ) {}

  async toggle(userId: string, postId: string): Promise<boolean> {
    // Ensure post exists
    const post = await this.postsService.findById(postId);

    // Block check: cannot like a post by someone you've blocked (or who has blocked you).
    if (await this.blocks.isBlockedEitherWay(userId, post.authorId)) {
      throw new ForbiddenException('cannot interact with this post');
    }

    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postsService.decrementLikes(postId);
      return false; // unliked
    }

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    await this.postsService.incrementLikes(postId);

    // Best-effort notification to the post author (skipped if self-like).
    await this.notifications.create({
      recipientId: post.authorId,
      actorId: userId,
      type: NotificationType.Like,
      entityType: post.isReel ? NotificationEntityType.Reel : NotificationEntityType.Post,
      entityId: postId,
    });

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
