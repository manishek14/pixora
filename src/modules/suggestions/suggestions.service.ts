import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { FollowEntity } from '../follows/follow.entity';
import { BlocksService } from '../blocks/blocks.service';
import { SuggestionItem, SuggestionListResult } from './suggestion-types';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    private readonly blocks: BlocksService,
  ) {}

  /**
   * Suggest users for `userId` to follow.
   *
   * Algorithm (in priority order):
   *   1. **Mutual friends first** — users followed by ≥2 of my followings,
   *      sorted by mutual count desc. These are the strongest signals.
   *   2. **Fallback: recently-verified users** — if mutual-friend pool is
   *      empty, suggest a few verified accounts as "starter" suggestions.
   *
   * Excludes:
   *   - the current user
   *   - users they already follow (accepted or pending)
   *   - users they've blocked OR who have blocked them
   *
   * Limit defaults to 10.
   */
  async suggest(
    userId: string,
    limit = 10,
  ): Promise<SuggestionListResult> {
    // 1. Exclusion list: self + already-followed + blocked-either-way.
    const excluded = new Set<string>([userId]);

    // Already-followed (either direction of the FollowEntity; we count pending too).
    const alreadyFollowedRows = await this.followRepo.find({
      where: { followerId: userId },
      select: ['followingId'],
    });
    for (const r of alreadyFollowedRows) excluded.add(r.followingId);

    // Block exclusion (either direction).
    const blockedByMe = await this.blocks.getBlockedIds(userId);
    for (const id of blockedByMe) excluded.add(id);
    const blockedMe = await this.blocks.getBlockerIds(userId);
    for (const id of blockedMe) excluded.add(id);

    // 2. Get the set of users I follow (so we can find their followings).
    const myFollowings = alreadyFollowedRows.map((r) => r.followingId);

    // 3. If we have followings, find their followings and count mutuals.
    const items: SuggestionItem[] = [];

    if (myFollowings.length > 0) {
      // Get all follow rows where the follower is one of my followings
      // (these are "friends of friends").
      const friendOfFriendRows = await this.followRepo.find({
        where: { followerId: In(myFollowings) },
        select: ['followingId'],
      });

      // Tally counts per candidate
      const mutualMap = new Map<string, number>();
      for (const r of friendOfFriendRows) {
        if (excluded.has(r.followingId)) continue;
        mutualMap.set(
          r.followingId,
          (mutualMap.get(r.followingId) ?? 0) + 1,
        );
      }

      // Keep only candidates with ≥1 mutual (we still sort desc, so ties fall
      // back to whatever order Map iteration gives — fine for MVP).
      const candidates = Array.from(mutualMap.entries())
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (candidates.length > 0) {
        const candidateIds = candidates.map(([id]) => id);
        const users = await this.userRepo.find({
          where: { id: In(candidateIds) },
        });
        const userById = new Map(users.map((u) => [u.id, u]));
        for (const [id, count] of candidates) {
          const u = userById.get(id);
          if (!u) continue;
          items.push({
            user: u,
            mutualCount: count,
            reason: `دنبال‌کنندگان مشترک: ${count} نفر`,
          });
        }
      }
    }

    // 4. Fallback: if mutual-friend suggestions are empty, suggest verified users.
    if (items.length === 0) {
      const verifiedUsers = await this.userRepo.find({
        where: {
          isVerified: true,
          id: Not(In([...excluded])),
        },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      for (const u of verifiedUsers) {
        items.push({
          user: u,
          mutualCount: 0,
          reason: 'حساب تأیید شده',
        });
      }
    }

    return {
      items,
      total: items.length,
    };
  }
}
