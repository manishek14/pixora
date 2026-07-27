/**
 * Pixora Realtime Client — Socket.io wrapper for the browser.
 *
 * Drop-in helper that connects to the Pixora backend's Socket.io gateway
 * with JWT auth, and exposes typed event subscriptions for the 6 server-
 * emitted events:
 *
 *   - message_received      — { threadId, message }
 *   - message_read          — { threadId, readerId, messageIds }
 *   - message_deleted       — { threadId, messageId }
 *   - notification_received — { notification }
 *   - typing                — { threadId, userId, isTyping }
 *   - presence_update       — { userId, isOnline, lastSeenAt }
 *
 * Usage (in a React component or vanilla JS):
 *
 *   const rt = new PixoraRealtime('http://localhost:4000', () => getAccessToken());
 *   await rt.connect();
 *   const off = rt.onMessageReceived(({ threadId, message }) => {
 *     console.log('new DM in', threadId, message.text);
 *   });
 *   // ... later
 *   off();  // unsubscribe
 *   rt.disconnect();
 *
 * The client auto-reconnects with exponential backoff (socket.io default).
 * On reconnect, the server will broadcast presence_update to friends again.
 *
 * Install: `npm install socket.io-client`
 */

import { io, Socket } from 'socket.io-client';

export interface PixoraMessage {
  id: string;
  threadId: string;
  senderId: string;
  sender?: { id: string; username: string; avatarUrl?: string };
  text?: string;
  mediaUrls?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface PixoraNotification {
  id: string;
  type: string; // 'like' | 'comment' | 'follow' | ... (raw DB value)
  recipientId: string;
  actor?: { id: string; username: string; avatarUrl?: string };
  actorId?: string;
  entityType?: string;
  entityId?: string;
  text?: string;
  isRead: boolean;
  createdAt: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export class PixoraRealtime {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners = new Set<(s: ConnectionStatus) => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null,
  ) {}

  /** Open the socket connection. Resolves once connected. */
  connect(): Promise<void> {
    if (this.socket?.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const token = this.getToken();
      if (!token) {
        reject(new Error('no access token available'));
        return;
      }

      this.setStatus('connecting');
      this.socket = io(this.baseUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      this.socket.on('connect', () => {
        this.setStatus('connected');
        resolve();
      });
      this.socket.on('disconnect', () => {
        this.setStatus('disconnected');
      });
      this.socket.on('connect_error', (err: Error) => {
        this.setStatus('disconnected');
        // Only reject the initial connect promise; auto-reconnect handles the rest
        reject(err);
      });
    });
  }

  /** Close the socket connection. */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('disconnected');
  }

  /** Current connection status. */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe fn. */
  onStatusChange(cb: (s: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  // -------------------------------------------------------------------------
  // Server → client events
  // -------------------------------------------------------------------------

  onMessageReceived(cb: (p: { threadId: string; message: PixoraMessage }) => void): () => void {
    return this.subscribe('message_received', cb);
  }

  onMessageRead(cb: (p: { threadId: string; readerId: string; messageIds: string[] }) => void): () => void {
    return this.subscribe('message_read', cb);
  }

  onMessageDeleted(cb: (p: { threadId: string; messageId: string }) => void): () => void {
    return this.subscribe('message_deleted', cb);
  }

  onNotificationReceived(cb: (p: { notification: PixoraNotification }) => void): () => void {
    return this.subscribe('notification_received', cb);
  }

  onTyping(cb: (p: { threadId: string; userId: string; isTyping: boolean }) => void): () => void {
    return this.subscribe('typing', cb);
  }

  onPresenceUpdate(cb: (p: { userId: string; isOnline: boolean; lastSeenAt: number }) => void): () => void {
    return this.subscribe('presence_update', cb);
  }

  // -------------------------------------------------------------------------
  // Client → server events
  // -------------------------------------------------------------------------

  /** Tell the server the user is typing in a thread (or stopped). */
  emitTyping(threadId: string, isTyping = true): void {
    this.socket?.emit('typing', { threadId, isTyping });
  }

  /** Join a thread room (for typing indicators scoped to that thread). */
  joinThread(threadId: string): void {
    this.socket?.emit('joinThread', { threadId });
  }

  leaveThread(threadId: string): void {
    this.socket?.emit('leaveThread', { threadId });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private subscribe<T>(event: string, cb: (p: T) => void): () => void {
    if (!this.socket) {
      console.warn(`[PixoraRealtime] subscribe('${event}') called before connect()`);
      return () => {};
    }
    this.socket.on(event, cb as any);
    return () => this.socket?.off(event, cb as any);
  }

  private setStatus(s: ConnectionStatus): void {
    this.status = s;
    for (const cb of this.statusListeners) cb(s);
  }
}
