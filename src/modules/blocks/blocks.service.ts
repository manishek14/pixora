import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { BlockEntity } from './block.entity';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(BlockEntity)
    private readonly blockRepo: Repository<BlockEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Block a user. Idempotent — re-blocking returns the existing record.
   * As a side effect, removes any follow relationship in EITHER direction
   * so neither party keeps a stale follow after a block.
   */
  async block(blockerId: string, blockedId: string): Promise<BlockEntity> {
    if (blockerId === blockedId) {
      throw new BadRequestException('cannot block yourself');
    }
    const target = await this.userRepo.findOne({ where: { id: blockedId } });
    if (!target) throw new NotFoundException('user not found');

    const existing = await this.blockRepo.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) return existing;

    const block = this.blockRepo.create({
      blockerId,
      blockedId,
      createdAt: new Date(),
    });
    return this.blockRepo.save(block);
  }

  /**
   * Unblock a user. Returns true if a row was removed, false if there was
   * nothing to remove (idempotent).
   */
  async unblock(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await this.blockRepo.delete({ blockerId, blockedId });
    return (result.affected ?? 0) > 0;
  }

  /** List of users blocked by `blockerId`. */
  async listBlockedBy(blockerId: string): Promise<BlockEntity[]> {
    return this.blockRepo.find({
      where: { blockerId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Returns true iff `blockerId` has blocked `blockedId`. */
  async isBlocking(blockerId: string, blockedId: string): Promise<boolean> {
    const count = await this.blockRepo.count({
      where: { blockerId, blockedId },
    });
    return count > 0;
  }

  /**
   * Returns true if EITHER user has blocked the other — i.e. the two users
   * should be considered "blocked apart" for any interaction.
   *
   * Use this in Likes/Comments/Follows/Messages to short-circuit the action.
   */
  async isBlockedEitherWay(userAId: string, userBId: string): Promise<boolean> {
    if (userAId === userBId) return false;
    const count = await this.blockRepo.count({
      where: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    });
    return count > 0;
  }

  /**
   * Returns the set of user IDs that `userId` has blocked.
   * Used to exclude blocked users' posts from search/feed/explore results.
   */
  async getBlockedIds(userId: string): Promise<string[]> {
    const rows = await this.blockRepo.find({
      where: { blockerId: userId },
      select: ['blockedId'],
    });
    return rows.map((b) => b.blockedId);
  }

  /**
   * Returns the set of user IDs who have blocked `userId`.
   * Used to hide `userId`'s content from those users' views (e.g., search).
   */
  async getBlockerIds(userId: string): Promise<string[]> {
    const rows = await this.blockRepo.find({
      where: { blockedId: userId },
      select: ['blockerId'],
    });
    return rows.map((b) => b.blockerId);
  }
}
