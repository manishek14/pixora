import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from '@/modules/messages/messages.service';
import { BlocksService } from '@/modules/blocks/blocks.service';
import { MessageThreadEntity } from '@/modules/messages/entities/message-thread.entity';
import { MessageEntity } from '@/modules/messages/entities/message.entity';
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
import { BlockEntity } from '@/modules/blocks/block.entity';
import { MuteEntity } from '@/modules/mutes/mute.entity';
import { CollectionEntity } from '@/modules/collections/collection.entity';
import { CollectionItemEntity } from '@/modules/collections/collection-item.entity';
import { NotificationEntity } from '@/modules/notifications/entities/notification.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let threadRepo: Repository<MessageThreadEntity>;
  let messageRepo: Repository<MessageEntity>;
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
            BlockEntity,
            MuteEntity,
            CollectionEntity,
            CollectionItemEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([MessageThreadEntity, MessageEntity, UserEntity, BlockEntity]),
      ],
      providers: [MessagesService, BlocksService],
    }).compile();

    service = moduleRef.get(MessagesService);
    threadRepo = moduleRef.get(getRepositoryToken(MessageThreadEntity));
    messageRepo = moduleRef.get(getRepositoryToken(MessageEntity));
    userRepo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
  });

  beforeEach(async () => {
    await messageRepo.clear();
    await threadRepo.clear();
    await userRepo.clear();
  });

  // ------------------------------------------------------------------
  // send
  // ------------------------------------------------------------------
  describe('send', () => {
    it('creates a new thread and message on first contact', async () => {
      const a = await newUser('alice');
      const b = await newUser('bob');
      const msg = await service.send(a.id, { recipientId: b.id, text: 'hi bob' });
      expect(msg.text).toBe('hi bob');
      expect(msg.senderId).toBe(a.id);
      expect(msg.isRead).toBe(false);
      const threads = await threadRepo.find();
      expect(threads).toHaveLength(1);
      // Normalized ordering: smaller UUID first
      const [userAId, userBId] = [a.id, b.id].sort();
      expect(threads[0].userAId).toBe(userAId);
      expect(threads[0].userBId).toBe(userBId);
      expect(threads[0].lastMessageAt).not.toBeNull();
    });

    it('reuses the existing thread on subsequent messages', async () => {
      const a = await newUser('alice2');
      const b = await newUser('bob2');
      await service.send(a.id, { recipientId: b.id, text: 'first' });
      await service.send(a.id, { recipientId: b.id, text: 'second' });
      await service.send(b.id, { recipientId: a.id, text: 'reply' });
      const threads = await threadRepo.find();
      expect(threads).toHaveLength(1);
      const messages = await messageRepo.find({ order: { createdAt: 'ASC' } });
      expect(messages).toHaveLength(3);
    });

    it('rejects sending a message to yourself', async () => {
      const a = await newUser('lonely');
      await expect(
        service.send(a.id, { recipientId: a.id, text: 'self talk' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty message (no text, no media)', async () => {
      const a = await newUser('a3');
      const b = await newUser('b3');
      await expect(
        service.send(a.id, { recipientId: b.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows media-only messages (text optional)', async () => {
      const a = await newUser('a4');
      const b = await newUser('b4');
      const msg = await service.send(a.id, {
        recipientId: b.id,
        mediaUrls: ['https://cdn.test/p.jpg'],
      });
      expect(msg.mediaUrls).toEqual(['https://cdn.test/p.jpg']);
      expect(msg.text).toBeNull();
    });

    it('throws NotFound when recipient does not exist', async () => {
      const a = await newUser('a5');
      await expect(
        service.send(a.id, { recipientId: '00000000-0000-0000-0000-000000000000', text: 'hi' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------------
  // listThreads
  // ------------------------------------------------------------------
  describe('listThreads', () => {
    it('returns empty list for a user with no threads', async () => {
      const a = await newUser('a6');
      const result = await service.listThreads(a.id);
      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.unreadCount).toBe(0);
    });

    it('returns threads newest-first by lastMessageAt', async () => {
      const a = await newUser('a7');
      const b = await newUser('b7');
      const c = await newUser('c7');
      await service.send(a.id, { recipientId: b.id, text: 'old' });
      await new Promise((res) => setTimeout(res, 10));
      await service.send(a.id, { recipientId: c.id, text: 'newer' });

      const result = await service.listThreads(a.id);
      expect(result.items).toHaveLength(2);
      // Newest first — the thread with c is the most recently active
      const latestMsg = result.items[0].messages?.[0];
      expect(latestMsg?.text).toBe('newer');
    });

    it('preloads the latest message of each thread', async () => {
      const a = await newUser('a8');
      const b = await newUser('b8');
      await service.send(a.id, { recipientId: b.id, text: 'msg1' });
      await new Promise((res) => setTimeout(res, 10));
      await service.send(a.id, { recipientId: b.id, text: 'msg2' });
      await new Promise((res) => setTimeout(res, 10));
      await service.send(b.id, { recipientId: a.id, text: 'reply' });

      const result = await service.listThreads(a.id);
      expect(result.items).toHaveLength(1);
      const t = result.items[0];
      expect(t.messages).toHaveLength(1); // only the latest is preloaded
      expect(t.messages[0].text).toBe('reply');
    });

    it('reports unreadCount correctly across threads', async () => {
      const a = await newUser('a9');
      const b = await newUser('b9');
      const c = await newUser('c9');
      // Two unread incoming messages in two different threads
      await service.send(b.id, { recipientId: a.id, text: 'from b' });
      await service.send(c.id, { recipientId: a.id, text: 'from c' });
      // A message FROM a doesn't count as unread for a
      await service.send(a.id, { recipientId: b.id, text: 'a to b' });
      const result = await service.listThreads(a.id);
      expect(result.unreadCount).toBe(2);
    });
  });

  // ------------------------------------------------------------------
  // getThread
  // ------------------------------------------------------------------
  describe('getThread', () => {
    it('returns the thread with the most recent messages preloaded', async () => {
      const a = await newUser('a10');
      const b = await newUser('b10');
      await service.send(a.id, { recipientId: b.id, text: 'm1' });
      await new Promise((res) => setTimeout(res, 10));
      await service.send(b.id, { recipientId: a.id, text: 'm2' });
      const threads = await threadRepo.find();
      const threadId = threads[0].id;
      const thread = await service.getThread(a.id, threadId);
      expect(thread.messages).toHaveLength(2);
      expect(thread.messages[0].text).toBe('m2'); // newest first
    });

    it('throws NotFound when thread does not exist', async () => {
      const a = await newUser('a11');
      await expect(service.getThread(a.id, 'nope-id')).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when caller is not a participant', async () => {
      const a = await newUser('a12');
      const b = await newUser('b12');
      const c = await newUser('c12');
      await service.send(a.id, { recipientId: b.id, text: 'private' });
      const threads = await threadRepo.find();
      await expect(service.getThread(c.id, threads[0].id)).rejects.toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------
  // getThreadWithUser
  // ------------------------------------------------------------------
  describe('getThreadWithUser', () => {
    it('creates a thread if one does not exist yet', async () => {
      const a = await newUser('a13');
      const b = await newUser('b13');
      const thread = await service.getThreadWithUser(a.id, b.id);
      expect(thread.id).toBeDefined();
      expect(thread.messages).toHaveLength(0);
    });
    it('reuses the existing thread if one already exists', async () => {
      const a = await newUser('a14');
      const b = await newUser('b14');
      await service.send(a.id, { recipientId: b.id, text: 'first' });
      const thread = await service.getThreadWithUser(a.id, b.id);
      expect(thread.messages).toHaveLength(1);
    });
    it('rejects opening a thread with yourself', async () => {
      const a = await newUser('a15');
      await expect(service.getThreadWithUser(a.id, a.id)).rejects.toThrow(BadRequestException);
    });
  });

  // ------------------------------------------------------------------
  // markThreadRead
  // ------------------------------------------------------------------
  describe('markThreadRead', () => {
    it('marks incoming messages as read and returns the affected count', async () => {
      const a = await newUser('a16');
      const b = await newUser('b16');
      await service.send(b.id, { recipientId: a.id, text: 'incoming1' });
      await service.send(b.id, { recipientId: a.id, text: 'incoming2' });
      await service.send(a.id, { recipientId: b.id, text: 'outgoing' });
      const threads = await threadRepo.find();
      const count = await service.markThreadRead(a.id, threads[0].id);
      expect(count).toBe(2);
      const result = await service.listThreads(a.id);
      expect(result.unreadCount).toBe(0);
    });

    it('is idempotent — second call returns 0', async () => {
      const a = await newUser('a17');
      const b = await newUser('b17');
      await service.send(b.id, { recipientId: a.id, text: 'x' });
      const threads = await threadRepo.find();
      await service.markThreadRead(a.id, threads[0].id);
      const count = await service.markThreadRead(a.id, threads[0].id);
      expect(count).toBe(0);
    });

    it('does not mark outgoing messages as read', async () => {
      const a = await newUser('a18');
      const b = await newUser('b18');
      await service.send(a.id, { recipientId: b.id, text: 'outgoing' });
      const threads = await threadRepo.find();
      const count = await service.markThreadRead(a.id, threads[0].id);
      expect(count).toBe(0);
    });

    it('throws Forbidden when non-participant tries to mark', async () => {
      const a = await newUser('a19');
      const b = await newUser('b19');
      const c = await newUser('c19');
      await service.send(a.id, { recipientId: b.id, text: 'private' });
      const threads = await threadRepo.find();
      await expect(service.markThreadRead(c.id, threads[0].id)).rejects.toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------
  // getUnreadCount
  // ------------------------------------------------------------------
  describe('getUnreadCount', () => {
    it('returns 0 when user has no threads', async () => {
      const a = await newUser('a20');
      expect(await service.getUnreadCount(a.id)).toBe(0);
    });
    it('sums unread messages across multiple threads', async () => {
      const a = await newUser('a21');
      const b = await newUser('b21');
      const c = await newUser('c21');
      await service.send(b.id, { recipientId: a.id, text: 'thread1' });
      await service.send(c.id, { recipientId: a.id, text: 'thread2a' });
      await service.send(c.id, { recipientId: a.id, text: 'thread2b' });
      expect(await service.getUnreadCount(a.id)).toBe(3);
    });
  });

  // ------------------------------------------------------------------
  // deleteMessage
  // ------------------------------------------------------------------
  describe('deleteMessage', () => {
    it('allows the sender to delete their own message', async () => {
      const a = await newUser('a22');
      const b = await newUser('b22');
      const msg = await service.send(a.id, { recipientId: b.id, text: 'oops' });
      const ok = await service.deleteMessage(a.id, msg.id);
      expect(ok).toBe(true);
      expect(await messageRepo.count({ where: { id: msg.id } })).toBe(0);
    });
    it('forbids deleting another users message', async () => {
      const a = await newUser('a23');
      const b = await newUser('b23');
      const msg = await service.send(a.id, { recipientId: b.id, text: 'mine' });
      await expect(service.deleteMessage(b.id, msg.id)).rejects.toThrow(ForbiddenException);
    });
    it('throws NotFound when message does not exist', async () => {
      const a = await newUser('a24');
      await expect(service.deleteMessage(a.id, 'nonexistent-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
