import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { NotificationEntity } from '@/modules/notifications/entities/notification.entity';
import { UserEntity } from '@/modules/users/user.entity';
import { PostEntity } from '@/modules/posts/post.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity } from '@/modules/highlights/entities/highlight-item.entity';
import { ReelViewEntity } from '@/modules/reels/entities/reel-view.entity';
import { BookmarkEntity } from '@/modules/bookmarks/bookmark.entity';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
import { NotificationType, NotificationEntityType } from '@/modules/notifications/entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: Repository<NotificationEntity>;
  let userRepo: Repository<UserEntity>;
  let moduleRef: any;

  const newUser = async (username: string) => {
    const user = userRepo.create({
      username,
      email: `${username}@test.com`,
      password: 'hashed',
    });
    return userRepo.save(user);
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [
            UserEntity,
            PostEntity,
            FollowEntity,
            LikeEntity,
            CommentEntity,
            StoryEntity,
            StoryViewEntity,
            StoryReactionEntity,
            HighlightEntity,
            HighlightItemEntity,
            ReelViewEntity,
            BookmarkEntity,
            NotificationEntity,
            MessageThreadEntity,
            MessageEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([NotificationEntity, UserEntity]),
      ],
      providers: [NotificationsService],
    }).compile();

    service = moduleRef.get(NotificationsService);
    notifRepo = moduleRef.get(getRepositoryToken(NotificationEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await notifRepo.clear();
    await userRepo.clear();
  });

  describe('create', () => {
    it('creates a notification with the provided fields', async () => {
      const recipient = await newUser('alice');
      const actor = await newUser('bob');
      const n = await service.create({
        recipientId: recipient.id,
        actorId: actor.id,
        type: NotificationType.Like,
        entityType: NotificationEntityType.Post,
        entityId: 'post-uuid-1',
      });
      expect(n).toBeDefined();
      expect(n).not.toBeNull();
      expect(n!.recipientId).toBe(recipient.id);
      expect(n!.actorId).toBe(actor.id);
      expect(n!.type).toBe(NotificationType.Like);
      expect(n!.isRead).toBe(false);
    });

    it('skips creating a notification when actor === recipient (self-action)', async () => {
      const user = await newUser('self');
      const n = await service.create({
        recipientId: user.id,
        actorId: user.id,
        type: NotificationType.Like,
        entityType: NotificationEntityType.Post,
        entityId: 'post-uuid',
      });
      expect(n).toBeNull();
      const count = await notifRepo.count();
      expect(count).toBe(0);
    });

    it('allows actorId to be null (system notification)', async () => {
      const recipient = await newUser('sys');
      const n = await service.create({
        recipientId: recipient.id,
        type: NotificationType.System,
        text: 'Welcome to Lenz!',
      });
      expect(n).not.toBeNull();
      expect(n!.actorId).toBeNull();
      expect(n!.text).toBe('Welcome to Lenz!');
    });

    it('is best-effort — text/entityType/entityId all optional', async () => {
      const recipient = await newUser('opt');
      const actor = await newUser('act');
      const n = await service.create({
        recipientId: recipient.id,
        actorId: actor.id,
        type: NotificationType.Follow,
      });
      expect(n).not.toBeNull();
      expect(n!.entityType).toBeNull();
      expect(n!.entityId).toBeNull();
      expect(n!.text).toBeNull();
    });
  });

  describe('list', () => {
    it('returns notifications newest-first', async () => {
      const r = await newUser('rec');
      const a = await newUser('act');
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      await new Promise((res) => setTimeout(res, 10));
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Comment });
      await new Promise((res) => setTimeout(res, 10));
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Follow });

      const result = await service.list(r.id, 20, 0, false);
      expect(result.items).toHaveLength(3);
      expect(result.items[0].type).toBe(NotificationType.Follow);
      expect(result.items[2].type).toBe(NotificationType.Like);
      expect(result.hasMore).toBe(false);
      expect(result.unreadCount).toBe(3);
    });

    it('onlyUnread=true filters out read notifications', async () => {
      const r = await newUser('r2');
      const a = await newUser('a2');
      const n1 = await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Comment });
      await service.markAsRead(r.id, n1!.id);
      const result = await service.list(r.id, 20, 0, true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe(NotificationType.Comment);
      expect(result.unreadCount).toBe(1);
    });

    it('paginates results with hasMore flag', async () => {
      const r = await newUser('r3');
      const a = await newUser('a3');
      for (let i = 0; i < 5; i++) {
        await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
        await new Promise((res) => setTimeout(res, 5));
      }
      const page1 = await service.list(r.id, 2, 0, false);
      expect(page1.items).toHaveLength(2);
      expect(page1.hasMore).toBe(true);
      const page2 = await service.list(r.id, 2, 2, false);
      expect(page2.items).toHaveLength(2);
      const page3 = await service.list(r.id, 2, 4, false);
      expect(page3.items).toHaveLength(1);
      expect(page3.hasMore).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('returns 0 when there are no notifications', async () => {
      const r = await newUser('r4');
      expect(await service.getUnreadCount(r.id)).toBe(0);
    });
    it('counts only unread notifications for the recipient', async () => {
      const r = await newUser('r5');
      const a = await newUser('a5');
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      const n2 = await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Comment });
      await service.markAsRead(r.id, n2!.id);
      expect(await service.getUnreadCount(r.id)).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('marks a single notification as read', async () => {
      const r = await newUser('r6');
      const a = await newUser('a6');
      const n = await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      const updated = await service.markAsRead(r.id, n!.id);
      expect(updated.isRead).toBe(true);
    });
    it('is idempotent — marking an already-read notification again does nothing', async () => {
      const r = await newUser('r7');
      const a = await newUser('a7');
      const n = await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      await service.markAsRead(r.id, n!.id);
      const updated = await service.markAsRead(r.id, n!.id);
      expect(updated.isRead).toBe(true);
    });
    it('throws NotFound when notification does not exist', async () => {
      const r = await newUser('r8');
      await expect(service.markAsRead(r.id, 'nonexistent-uuid')).rejects.toThrow(NotFoundException);
    });
    it('throws NotFound when notification belongs to another user', async () => {
      const r1 = await newUser('r9');
      const r2 = await newUser('r10');
      const a = await newUser('a10');
      const n = await service.create({ recipientId: r1.id, actorId: a.id, type: NotificationType.Like });
      await expect(service.markAsRead(r2.id, n!.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read and returns the count', async () => {
      const r = await newUser('r11');
      const a = await newUser('a11');
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Comment });
      await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Follow });
      const count = await service.markAllAsRead(r.id);
      expect(count).toBe(3);
      expect(await service.getUnreadCount(r.id)).toBe(0);
    });
    it('does not affect other users notifications', async () => {
      const r1 = await newUser('r12');
      const r2 = await newUser('r13');
      const a = await newUser('a13');
      await service.create({ recipientId: r1.id, actorId: a.id, type: NotificationType.Like });
      await service.create({ recipientId: r2.id, actorId: a.id, type: NotificationType.Like });
      const count = await service.markAllAsRead(r1.id);
      expect(count).toBe(1);
      expect(await service.getUnreadCount(r2.id)).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes a notification owned by the user and returns true', async () => {
      const r = await newUser('r14');
      const a = await newUser('a14');
      const n = await service.create({ recipientId: r.id, actorId: a.id, type: NotificationType.Like });
      const ok = await service.delete(r.id, n!.id);
      expect(ok).toBe(true);
      expect(await notifRepo.count({ where: { id: n!.id } })).toBe(0);
    });
    it('returns false when notification does not exist', async () => {
      const r = await newUser('r15');
      const ok = await service.delete(r.id, 'nonexistent-uuid');
      expect(ok).toBe(false);
    });
    it('returns false when notification belongs to another user (no leak)', async () => {
      const r1 = await newUser('r16');
      const r2 = await newUser('r17');
      const a = await newUser('a17');
      const n = await service.create({ recipientId: r1.id, actorId: a.id, type: NotificationType.Like });
      const ok = await service.delete(r2.id, n!.id);
      expect(ok).toBe(false);
      expect(await notifRepo.count({ where: { id: n!.id } })).toBe(1);
    });
  });
});
