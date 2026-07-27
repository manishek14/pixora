import { Injectable, NotFoundException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { NotificationEntity, NotificationType, NotificationEntityType } from './entities/notification.entity';
import { RealtimeEvents } from '../realtime/realtime.events';
import { PushService } from '../push/push.service';

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
    @Optional()
    @Inject(RealtimeEvents)
    private readonly realtime: RealtimeEvents | null,
    @Optional()
    @Inject(PushService)
    private readonly push: PushService | null,
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
    const saved = await this.notifRepo.save(notif);

    // Reload with relations (actor, recipient) populated — needed for the
    // realtime event payload and for consistent GraphQL response shapes.
    // `save()` returns the row without eager relations, so we re-fetch.
    const reloaded = await this.notifRepo.findOne({
      where: { id: saved.id },
    });

    // Realtime: push the new notification to the recipient's sockets.
    // The recipient's UI updates the bell badge without polling.
    if (this.realtime) {
      this.realtime.emitToUser(params.recipientId, 'notification_received', {
        notification: reloaded ?? saved,
      });
    }

    // Web Push: send a system notification to all of the recipient's
    // subscribed devices. Best-effort — failures are logged in PushService.
    if (this.push) {
      const notifForPush = reloaded ?? saved;
      const { title, body, url } = this.buildPushPayload(notifForPush);
      this.push
        .sendPush(params.recipientId, {
          title,
          body,
          url,
          tag: `notif:${saved.type}:${saved.id}`,
          data: {
            notificationId: saved.id,
            type: saved.type,
            entityId: saved.entityId,
          },
        })
        .catch(() => void 0);
    }

    return reloaded ?? saved;
  }

  /**
   * Build a human-readable push payload from a notification. The actual
   * strings are intentionally generic — the frontend can localize further
   * based on the `type` field if needed.
   */
  private buildPushPayload(
    notif: NotificationEntity,
  ): { title: string; body: string; url?: string } {
    const actorHandle = notif.actor?.username
      ? `@${notif.actor.username}`
      : 'Pixora';
    switch (notif.type) {
      case NotificationType.Like:
        return {
          title: 'Pixora',
          body: `${actorHandle} پست شما را پسندید`,
          url: notif.entityId ? `/post/${notif.entityId}` : undefined,
        };
      case NotificationType.Comment:
        return {
          title: 'Pixora',
          body: `${actorHandle} روی پست شما کامنت گذاشت`,
          url: notif.entityId ? `/post/${notif.entityId}` : undefined,
        };
      case NotificationType.Follow:
        return {
          title: 'Pixora',
          body: `${actorHandle} شما را دنبال کرد`,
          url: notif.actorId ? `/${notif.actorId}` : undefined,
        };
      case NotificationType.StoryReaction:
        return {
          title: 'Pixora',
          body: `${actorHandle} به استوری شما واکنش نشان داد`,
        };
      case NotificationType.StoryView:
        return {
          title: 'Pixora',
          body: `${actorHandle} استوری شما را دید`,
        };
      case NotificationType.ReelView:
        return {
          title: 'Pixora',
          body: `${actorHandle} ریلز شما را دید`,
        };
      case NotificationType.Mention:
        return {
          title: 'Pixora',
          body: `${actorHandle} شما را منشن کرد`,
          url: notif.entityId ? `/post/${notif.entityId}` : undefined,
        };
      case NotificationType.System:
      default:
        return {
          title: 'Pixora',
          body: notif.text ?? 'اطلاعیه جدید',
        };
    }
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
