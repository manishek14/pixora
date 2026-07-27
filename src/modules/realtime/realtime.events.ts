import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageThreadEntity } from '../messages/entities/message-thread.entity';
import { PresenceService } from './presence.service';

/**
 * RealtimeEvents — the safe, typed bridge from REST/GraphQL services to the
 * Socket.io server.
 *
 * Other modules (Messages, Notifications, …) inject this service instead of
 * reaching for the raw `Server` instance, for three reasons:
 *
 *  1. Testability — services can be unit-tested without spinning up a real
 *     socket server. The `emit*` methods are no-ops when no server is attached.
 *  2. Decoupling — services don't need to know about socket ids or rooms.
 *     They just say "emit this to user X" and we route it.
 *  3. API stability — if we later switch to Redis pub/sub for multi-node
 *     scaling, only this file needs to change.
 *
 * The `attachServer` method is called once by RealtimeGateway during init.
 */

export interface RealtimePayload {
  [key: string]: unknown;
}

type SocketServerLike = {
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
  emit: (event: string, payload: unknown) => void;
};

@Injectable()
export class RealtimeEvents {
  private readonly logger = new Logger(RealtimeEvents.name);
  private server: SocketServerLike | null = null;

  constructor(
    @InjectRepository(MessageThreadEntity)
    private readonly threadRepo: Repository<MessageThreadEntity>,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Called by RealtimeGateway once the Socket.io server is available.
   */
  attachServer(server: SocketServerLike): void {
    this.server = server;
    this.logger.log('Socket.io server attached');
  }

  isAttached(): boolean {
    return this.server !== null;
  }

  /**
   * Emit an event to ALL of a user's active sockets. If the user is offline,
   * this is a no-op (the caller is expected to also send a push notification
   * if appropriate).
   */
  emitToUser(userId: string, event: string, payload: RealtimePayload): void {
    if (!this.server) return;
    // Each socket joins a personal room `user:<userId>` on connect.
    // Emitting to that room guarantees delivery to every tab/device the user
    // has open. Sockets belonging to other users are unaffected.
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Emit an event to both participants of a thread, optionally excluding one
   * (typically the actor — e.g. the sender of a message doesn't need to be
   * told they just sent it).
   *
   * If `excludeUserId` is undefined, both participants receive the event.
   * If a participant is offline, the emit is a silent no-op for them.
   */
  async emitToThreadParticipants(
    threadId: string,
    event: string,
    payload: RealtimePayload,
    excludeUserId?: string,
  ): Promise<void> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      select: ['id', 'userAId', 'userBId'],
    });
    if (!thread) return;

    const recipients = [thread.userAId, thread.userBId].filter(
      (id) => id !== excludeUserId,
    );
    for (const recipientId of recipients) {
      this.emitToUser(recipientId, event, payload);
    }
  }

  /**
   * Emit an event to every mutual-follow friend of the given user.
   * Used for presence broadcasts (online/offline status).
   */
  async emitToFriends(
    userId: string,
    event: string,
    payload: RealtimePayload,
  ): Promise<void> {
    const friendIds = await this.presence.getMutualFollowIds(userId);
    for (const friendId of friendIds) {
      this.emitToUser(friendId, event, payload);
    }
  }
}
