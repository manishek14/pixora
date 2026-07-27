import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationEntityType,
} from '../notifications/entities/notification.entity';
import { BlocksService } from '../blocks/blocks.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    private readonly postsService: PostsService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlocksService,
  ) {}

  async create(userId: string, input: CreateCommentInput): Promise<CommentEntity> {
    // Ensure post exists
    const post = await this.postsService.findById(input.postId);

    // Block check: cannot comment on a post by someone you've blocked (or who has blocked you).
    if (await this.blocks.isBlockedEitherWay(userId, post.authorId)) {
      throw new ForbiddenException('cannot interact with this post');
    }

    const comment = this.commentRepo.create({
      userId,
      postId: input.postId,
      text: input.text,
      parentId: input.parentId || null,
    });

    const saved = await this.commentRepo.save(comment);
    await this.postsService.incrementComments(input.postId);

    // Best-effort notification to the post author (skipped if self-comment
    // or if replying to your own comment on your own post).
    await this.notifications.create({
      recipientId: post.authorId,
      actorId: userId,
      type: NotificationType.Comment,
      entityType: post.isReel ? NotificationEntityType.Reel : NotificationEntityType.Post,
      entityId: input.postId,
    });

    // Reload with user relation populated
    const reloaded = await this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    return reloaded || saved;
  }

  async findByPost(postId: string, limit = 50): Promise<CommentEntity[]> {
    // Get top-level comments first, then their replies
    const topLevel = await this.commentRepo.find({
      where: { postId, parentId: IsNull() },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Fetch replies for all top-level comments in one query
    if (topLevel.length > 0) {
      const parentIds = topLevel.map((c) => c.id);
      const replies = await this.commentRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.user', 'user')
        .where('c.parentId IN (:...parentIds)', { parentIds })
        .orderBy('c.createdAt', 'ASC')
        .getMany();

      const replyMap = new Map<string, CommentEntity[]>();
      for (const reply of replies) {
        const pid = reply.parentId as string;
        const list = replyMap.get(pid) || [];
        list.push(reply);
        replyMap.set(pid, list);
      }
      for (const c of topLevel) {
        c.replies = replyMap.get(c.id) || [];
      }
    }

    return topLevel;
  }

  async update(commentId: string, userId: string, text: string): Promise<CommentEntity> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('not allowed to edit this comment');
    }
    comment.text = text;
    return this.commentRepo.save(comment);
  }

  async delete(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('not allowed to delete this comment');
    }
    const postId = comment.postId;
    // delete replies first
    await this.commentRepo.delete({ parentId: commentId });
    await this.commentRepo.remove(comment);
    await this.postsService.decrementComments(postId);
    return true;
  }

  async countByPost(postId: string): Promise<number> {
    return this.commentRepo.count({ where: { postId } });
  }
}
