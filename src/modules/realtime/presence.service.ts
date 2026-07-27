import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from '../follows/follow.entity';

/**
 * In-memory presence tracker.
 *
 * Maps userId -> Set<socketId> so we can:
 *  - decide whether to broadcast a `presence_update` (online→offline, offline→online)
 *  - answer `onlineStatus(userIds)` queries without touching the DB
 *  - skip realtime events for users with no sockets (we still send push though)
 *
 * Online→offline transitions are deferred by GRACE_MS so a brief disconnect
 * (page reload, wifi blip) doesn't toggle the user's presence.
 */

interface PresenceEntry {
  socketIds: Set<string>;
  lastSeenAt: number;
  offlineTimer: NodeJS.Timeout | null;
}

const GRACE_MS = 30_000; // 30s grace period before offline

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private readonly users = new Map<string, PresenceEntry>();

  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  /**
   * Register a new socket for a user. Returns `true` if this is the user's
   * first active socket (i.e. they just came online).
   */
  addSocket(userId: string, socketId: string): boolean {
    let entry = this.users.get(userId);
    const wasEmpty = !entry || entry.socketIds.size === 0;

    if (!entry) {
      entry = {
        socketIds: new Set<string>(),
        lastSeenAt: Date.now(),
        offlineTimer: null,
      };
      this.users.set(userId, entry);
    }

    entry.socketIds.add(socketId);
    entry.lastSeenAt = Date.now();

    // Cancel any pending offline transition (reconnection within grace period)
    if (entry.offlineTimer) {
      clearTimeout(entry.offlineTimer);
      entry.offlineTimer = null;
    }

    return wasEmpty;
  }

  /**
   * Remove a socket for a user. Returns `true` if this was the user's last
   * socket (i.e. they just went offline — subject to the grace period).
   */
  removeSocket(userId: string, socketId: string): boolean {
    const entry = this.users.get(userId);
    if (!entry) return false;

    entry.socketIds.delete(socketId);
    entry.lastSeenAt = Date.now();

    if (entry.socketIds.size === 0) {
      // Schedule offline transition; cleared if a new socket is added before fire
      if (entry.offlineTimer) clearTimeout(entry.offlineTimer);
      entry.offlineTimer = setTimeout(() => {
        const current = this.users.get(userId);
        if (current && current.socketIds.size === 0) {
          this.users.delete(userId);
          this.logger.debug(`user ${userId} went offline (grace expired)`);
        }
      }, GRACE_MS);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    const entry = this.users.get(userId);
    return !!entry && entry.socketIds.size > 0;
  }

  /**
   * Get the list of currently-online user IDs.
   */
  getOnlineUserIds(): string[] {
    const out: string[] = [];
    for (const [userId, entry] of this.users) {
      if (entry.socketIds.size > 0) out.push(userId);
    }
    return out;
  }

  /**
   * Returns the set of socket IDs for a user (empty if offline).
   * Used by RealtimeEvents to emit events to specific user sockets.
   */
  getSocketIds(userId: string): string[] {
    const entry = this.users.get(userId);
    if (!entry) return [];
    return Array.from(entry.socketIds);
  }

  /**
   * Return last-seen timestamp (ms epoch) for a user.
   * Returns 0 if we've never seen them online during this process lifetime.
   */
  getLastSeenAt(userId: string): number {
    return this.users.get(userId)?.lastSeenAt ?? 0;
  }

  /**
   * Returns the user IDs that the given user mutually follows (i.e. they
   * follow each other). Used to broadcast presence_update only to friends
   * rather than every user in the system.
   *
   * A is mutual with B iff there is an accepted FollowEntity (A->B) and an
   * accepted FollowEntity (B->A). We fetch both directions in a single query
   * by looking for any accepted follow where the user is either follower or
   * following, then computing the intersection.
   */
  async getMutualFollowIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({
      where: [
        { followerId: userId, isAccepted: true },
        { followingId: userId, isAccepted: true },
      ],
      select: ['followerId', 'followingId'],
    });

    const iFollow = new Set<string>();
    const followsMe = new Set<string>();
    for (const f of follows) {
      if (f.followerId === userId) iFollow.add(f.followingId);
      else if (f.followingId === userId) followsMe.add(f.followerId);
    }

    const mutual: string[] = [];
    for (const id of iFollow) {
      if (followsMe.has(id)) mutual.push(id);
    }
    return mutual;
  }

  /**
   * Convenience: returns online status for a batch of users.
   */
  getOnlineStatus(
    userIds: string[],
  ): Array<{ userId: string; isOnline: boolean; lastSeenAt: number }> {
    return userIds.map((userId) => ({
      userId,
      isOnline: this.isOnline(userId),
      lastSeenAt: this.getLastSeenAt(userId),
    }));
  }

  onModuleDestroy() {
    for (const [, entry] of this.users) {
      if (entry.offlineTimer) clearTimeout(entry.offlineTimer);
    }
    this.users.clear();
  }
}
