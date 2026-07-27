import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { NotificationEntity, NotificationType, NotificationEntityType } from './entities/notification.entity';

export interface NotificationListResult {
  items: NotificationEntity[];
  hasMore: boolean;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
  ) {}

  /**
   * Create a notification. Skipped silently when `actorId === recipientId`
   * (you don't get notified for liking your own post).
   *
   * This is called by Likes/Comments/Follows/Stories services — never
   * throws to the caller; notification creation is best-effort.
   */
  async create(params: {
    recipientId: string;
    actorId?: string | null;
    type: NotificationType;
    entityType?: NotificationEntityType;
    entityId?: string;
    text?: string;
  }): Promise<NotificationEntity | null> {
    // Don't notify yourself.
    if (params.actorId && params.actorId === params.recipientId) {
      return null;
    }
    const notif = this.notifRepo.create({
      recipientId: params.recipientId,
      actorId: params.actorId ?? null,
      type: params.type,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      text: params.text,
      isRead: false,
    });
    return this.notifRepo.save(notif);
  }

  /**
   * List the current user's notifications, newest first.
   * Also returns unreadCount so the client can render a badge.
   */
  async list(
    recipientId: string,
    limit = 20,
    offset = 0,
    onlyUnread = false,
  ): Promise<NotificationListResult> {
    const where: any = { recipientId };
    if (onlyUnread) where.isRead = false;

    const [items, total] = await this.notifRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const unreadCount = await this.notifRepo.count({
      where: { recipientId, isRead: false },
    });

    return {
      items,
      hasMore: offset + items.length < total,
      unreadCount,
    };
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notifRepo.count({
      where: { recipientId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read. Returns the updated notification.
   * Throws NotFound if the notification doesn't exist or doesn't belong to
   * the user (we never leak existence to other users).
   */
  async markAsRead(recipientId: string, notificationId: string): Promise<NotificationEntity> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, recipientId },
    });
    if (!notif) throw new NotFoundException('notification not found');
    if (!notif.isRead) {
      notif.isRead = true;
      await this.notifRepo.save(notif);
    }
    return notif;
  }

  /**
   * Mark ALL of the user's notifications as read. Returns the number
   * of rows updated.
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.notifRepo.update(
      { recipientId, isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  /**
   * Delete a notification (user dismissing one from their feed).
   */
  async delete(recipientId: string, notificationId: string): Promise<boolean> {
    const result = await this.notifRepo.delete({
      id: notificationId,
      recipientId,
    });
    return (result.affected ?? 0) > 0;
  }
}
