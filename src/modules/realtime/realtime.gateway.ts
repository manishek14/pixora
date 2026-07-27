import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PresenceService } from './presence.service';
import { RealtimeEvents } from './realtime.events';
import { MessageThreadEntity } from '../messages/entities/message-thread.entity';
import { TypingInput } from './dto/typing.input';

/**
 * Realtime gateway — the single Socket.io entry point for the whole app.
 *
 * Connection lifecycle:
 *  1. Client opens a connection with `io({ auth: { token: '<jwt>' } })` or
 *     `io({ extraHeaders: { Authorization: 'Bearer <jwt>' } })`.
 *  2. We verify the JWT in `handleConnection`. If invalid, the socket is
 *     disconnected immediately. If valid, we:
 *      - join a personal room `user:<userId>` (so `RealtimeEvents.emitToUser`
 *        can reach every tab/device the user has open)
 *      - register the socket with PresenceService
 *      - if this was the user's first active socket, broadcast
 *        `presence_update { userId, isOnline: true }` to all mutual follows
 *  3. On disconnect, we unregister the socket. If it was the user's last
 *     socket (after a 30s grace period), we broadcast
 *     `presence_update { userId, isOnline: false }` to mutual follows.
 *
 * Client → server events:
 *  - `typing` — broadcast a typing indicator to the other participant of a thread
 *  - `joinThread` — join the `thread:<id>` room (for thread-scoped events)
 *  - `leaveThread` — leave the `thread:<id>` room
 *
 * Server → client events (emitted via RealtimeEvents from other services):
 *  - `message_received`    — { threadId, message }
 *  - `message_read`        — { threadId, readerId, messageIds? }
 *  - `message_deleted`     — { threadId, messageId }
 *  - `notification_received` — { notification }
 *  - `typing`              — { threadId, userId, isTyping }
 *  - `presence_update`     — { userId, isOnline, lastSeenAt }
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/',
  // Socket.io 4 transports; websockets preferred, polling fallback for dev.
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presence: PresenceService,
    private readonly events: RealtimeEvents,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(MessageThreadEntity)
    private readonly threadRepo: Repository<MessageThreadEntity>,
  ) {}

  // -------------------------------------------------------------------------
  // Nest lifecycle: register the server with RealtimeEvents once available.
  // -------------------------------------------------------------------------
  afterInit() {
    this.events.attachServer(this.server as unknown as Parameters<RealtimeEvents['attachServer']>[0]);
    this.logger.log('Realtime gateway ready');
  }

  // -------------------------------------------------------------------------
  // Connection / disconnection
  // -------------------------------------------------------------------------

  async handleConnection(client: Socket) {
    const userId = await this.authenticate(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    // Stash the userId on the socket for later (typing, disconnect)
    (client.data as any).userId = userId;

    // Join personal room so RealtimeEvents.emitToUser() can reach this socket
    await client.join(`user:${userId}`);

    const cameOnline = this.presence.addSocket(userId, client.id);
    if (cameOnline) {
      this.logger.debug(`user ${userId} came online`);
      // Broadcast presence_update to mutual follows only — avoids spamming
      // every user in the system.
      this.events.emitToFriends(userId, 'presence_update', {
        userId,
        isOnline: true,
        lastSeenAt: Date.now(),
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId: string | undefined = (client.data as any).userId;
    if (!userId) return;

    const wentOffline = this.presence.removeSocket(userId, client.id);
    if (wentOffline) {
      this.logger.debug(`user ${userId} went offline (grace pending)`);
      // Note: PresenceService schedules the actual offline transition after
      // a grace period. We do NOT broadcast presence_update here — instead,
      // we broadcast it when the grace timer fires. To keep the API simple
      // and avoid a circular dep, we re-check after the grace window using
      // a setTimeout here as well.
      setTimeout(
        () => {
          if (!this.presence.isOnline(userId)) {
            this.events.emitToFriends(userId, 'presence_update', {
              userId,
              isOnline: false,
              lastSeenAt: Date.now(),
            });
          }
        },
        31_000, // 1s longer than PresenceService.GRACE_MS
      );
    }
  }

  // -------------------------------------------------------------------------
  // Client → server events
  // -------------------------------------------------------------------------

  /**
   * Client emits `typing` when the user starts/stops typing in a thread.
   * We verify that the sender is actually a participant, then forward the
   * event to the other participant via the `thread:<id>` room (which the
   * other participant joined via `joinThread`).
   */
  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TypingInput,
  ): Promise<void> {
    const senderId: string | undefined = (client.data as any).userId;
    if (!senderId || !body?.threadId) return;

    const thread = await this.threadRepo.findOne({
      where: { id: body.threadId },
      select: ['id', 'userAId', 'userBId'],
    });
    if (!thread) return;
    if (thread.userAId !== senderId && thread.userBId !== senderId) return;

    // Forward to the other participant's personal room so they receive the
    // typing indicator even if they're not currently viewing this thread.
    const recipientId =
      thread.userAId === senderId ? thread.userBId : thread.userAId;
    this.events.emitToUser(recipientId, 'typing', {
      threadId: body.threadId,
      userId: senderId,
      isTyping: !!body.isTyping,
    });
  }

  /**
   * Client emits `joinThread` when opening a thread view. Joins a thread-
   * scoped room so future per-thread events (e.g. typing indicators relayed
   * via the room) reach the client without per-user bookkeeping.
   */
  @SubscribeMessage('joinThread')
  async onJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ): Promise<void> {
    const userId: string | undefined = (client.data as any).userId;
    if (!userId || !body?.threadId) return;

    const thread = await this.threadRepo.findOne({
      where: { id: body.threadId },
      select: ['id', 'userAId', 'userBId'],
    });
    if (!thread) return;
    if (thread.userAId !== userId && thread.userBId !== userId) return;

    await client.join(`thread:${body.threadId}`);
  }

  @SubscribeMessage('leaveThread')
  async onLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ): Promise<void> {
    if (!body?.threadId) return;
    await client.leave(`thread:${body.threadId}`);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Authenticate the socket using either:
   *  - `socket.handshake.auth.token` (preferred — modern socket.io v4)
   *  - `socket.handshake.headers.authorization` (Bearer token fallback)
   *
   * Returns the userId on success, or null on failure.
   */
  private async authenticate(client: Socket): Promise<string | null> {
    const raw = this.extractToken(client);
    if (!raw) {
      this.logger.warn(`connection rejected: no token (sid=${client.id})`);
      return null;
    }

    try {
      const payload = this.jwt.verify<{ sub: string }>(raw, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') as string,
      });
      return payload.sub;
    } catch (err) {
      this.logger.warn(
        `connection rejected: invalid token (sid=${client.id}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  private extractToken(client: Socket): string | null {
    // 1. handshake.auth.token — preferred for browser clients
    const auth = (client.handshake as any).auth;
    if (auth?.token && typeof auth.token === 'string') {
      return auth.token.startsWith('Bearer ')
        ? auth.token.slice('Bearer '.length)
        : auth.token;
    }
    // 2. handshake.headers.authorization — fallback for older clients
    const hdr = client.handshake.headers.authorization;
    if (hdr && hdr.startsWith('Bearer ')) {
      return hdr.slice('Bearer '.length);
    }
    return null;
  }
}
