import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, Not } from 'typeorm';
import { MessageThreadEntity } from './entities/message-thread.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/user.entity';
import { SendMessageInput } from './dto/send-message.input';
import { ThreadListResult } from './thread-list-result';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageThreadEntity)
    private readonly threadRepo: Repository<MessageThreadEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Send a message to `recipientId`. Creates a thread on first contact,
   * or reuses the existing thread. Sender must not be the same as recipient.
   *
   * Side effects:
   *  - thread.lastMessageAt bumped to now
   *  - message.isRead = false (recipient has not seen it yet)
   *
   * Returns the created message (with sender relation populated).
   */
  async send(senderId: string, input: SendMessageInput): Promise<MessageEntity> {
    if (senderId === input.recipientId) {
      throw new BadRequestException('cannot send a message to yourself');
    }
    if (!input.text && (!input.mediaUrls || input.mediaUrls.length === 0)) {
      throw new BadRequestException('message must have text or media');
    }

    const recipient = await this.userRepo.findOne({
      where: { id: input.recipientId },
    });
    if (!recipient) throw new NotFoundException('recipient not found');

    const thread = await this.getOrCreateThread(senderId, input.recipientId);

    const message = this.messageRepo.create({
      threadId: thread.id,
      senderId,
      text: input.text ?? null,
      mediaUrls: input.mediaUrls ?? [],
      isRead: false,
      // Explicit createdAt preserves millisecond precision (better-sqlite3's
      // default CURRENT_TIMESTAMP is second-precision which makes consecutive
      // messages within the same second sort unreliably).
      createdAt: new Date(),
    });
    const saved = await this.messageRepo.save(message);

    // Bump thread.lastMessageAt for inbox ordering.
    thread.lastMessageAt = saved.createdAt;
    await this.threadRepo.save(thread);

    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    }) as Promise<MessageEntity>;
  }

  /**
   * List the current user's threads, newest-first (by lastMessageAt).
   * Returns the most recent message of each thread pre-loaded so the
   * client can render a preview without an extra round-trip.
   */
  async listThreads(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<ThreadListResult> {
    // Threads where I'm a participant. Sort by lastMessageAt desc; threads
    // with no messages yet fall back to createdAt. We use find() so that
    // eager relations (userA, userB) are loaded automatically.
    const [items, total] = await this.threadRepo.findAndCount({
      where: [{ userAId: userId }, { userBId: userId }],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Pre-fetch the last message of each thread in one query.
    if (items.length > 0) {
      const threadIds = items.map((t) => t.id);
      const latestMessages = await this.messageRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.sender', 'sender')
        .where('m.threadId IN (:...threadIds)', { threadIds })
        .orderBy('m.createdAt', 'DESC')
        .getMany();

      const latestByThread = new Map<string, MessageEntity>();
      for (const m of latestMessages) {
        if (!latestByThread.has(m.threadId)) {
          latestByThread.set(m.threadId, m);
        }
      }
      for (const t of items) {
        t.messages = latestByThread.has(t.id) ? [latestByThread.get(t.id)!] : [];
      }
    }

    const unreadCount = await this.getUnreadCount(userId);

    return {
      items,
      hasMore: offset + items.length < total,
      unreadCount,
    };
  }

  /**
   * Get a thread by id — verifies the caller is a participant.
   * Optionally preloads the last `limit` messages (newest-first).
   */
  async getThread(
    userId: string,
    threadId: string,
    messageLimit = 50,
  ): Promise<MessageThreadEntity> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException('thread not found');
    if (thread.userAId !== userId && thread.userBId !== userId) {
      throw new ForbiddenException('not a participant in this thread');
    }

    const messages = await this.messageRepo.find({
      where: { threadId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: messageLimit,
    });
    thread.messages = messages;
    return thread;
  }

  /**
   * Get (or create) a thread with a specific other user. If the thread
   * doesn't exist yet, it's created with no messages and lastMessageAt=null.
   */
  async getThreadWithUser(
    userId: string,
    otherUserId: string,
    messageLimit = 50,
  ): Promise<MessageThreadEntity> {
    if (userId === otherUserId) {
      throw new BadRequestException('cannot open a thread with yourself');
    }
    const other = await this.userRepo.findOne({ where: { id: otherUserId } });
    if (!other) throw new NotFoundException('user not found');

    const thread = await this.getOrCreateThread(userId, otherUserId);
    return this.getThread(userId, thread.id, messageLimit);
  }

  /**
   * Mark all incoming (non-self) messages in a thread as read.
   * Returns the number of messages that were flipped from unread→read.
   */
  async markThreadRead(userId: string, threadId: string): Promise<number> {
    // Verify participation
    const thread = await this.threadRepo.findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('thread not found');
    if (thread.userAId !== userId && thread.userBId !== userId) {
      throw new ForbiddenException('not a participant in this thread');
    }

    const result = await this.messageRepo.update(
      { threadId, senderId: Not(userId), isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  /**
   * Total unread messages across ALL of the user's threads.
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Find thread ids where I'm a participant
    const threads = await this.threadRepo.find({
      where: [{ userAId: userId }, { userBId: userId }],
      select: ['id'],
    });
    if (threads.length === 0) return 0;
    const threadIds = threads.map((t) => t.id);
    return this.messageRepo.count({
      where: {
        threadId: In(threadIds),
        senderId: Not(userId),
        isRead: false,
      },
    });
  }

  /**
   * Delete a message — only the sender can delete their own message.
   * This is a hard delete (no soft-delete tombstone); the message just
   * disappears from the thread for both participants.
   */
  async deleteMessage(userId: string, messageId: string): Promise<boolean> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('can only delete your own messages');
    }
    await this.messageRepo.remove(message);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Normalize the (userA, userB) ordering so userAId is always the
   * lexicographically smaller UUID. This guarantees the unique constraint
   * on (userAId, userBId) prevents duplicate threads between the same pair.
   */
  private normalizePair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  /**
   * Look up the existing thread for a pair of users, or create a new one.
   * Used by `send` and `getThreadWithUser`.
   */
  private async getOrCreateThread(
    user1: string,
    user2: string,
  ): Promise<MessageThreadEntity> {
    const [userAId, userBId] = this.normalizePair(user1, user2);

    const existing = await this.threadRepo.findOne({
      where: { userAId, userBId },
    });
    if (existing) return existing;

    const thread = this.threadRepo.create({
      userAId,
      userBId,
      lastMessageAt: undefined,
    });
    return this.threadRepo.save(thread);
  }
}
