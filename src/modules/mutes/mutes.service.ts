import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MuteEntity } from './mute.entity';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class MutesService {
  constructor(
    @InjectRepository(MuteEntity)
    private readonly muteRepo: Repository<MuteEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Mute a user with the given flags. If a mute row already exists, the flags
   * are updated in place (so the caller can switch from posts-only to
   * posts+stories without creating a duplicate row).
   */
  async mute(
    muterId: string,
    mutedId: string,
    mutePosts = true,
    muteStories = true,
  ): Promise<MuteEntity> {
    if (muterId === mutedId) {
      throw new BadRequestException('cannot mute yourself');
    }
    const target = await this.userRepo.findOne({ where: { id: mutedId } });
    if (!target) throw new NotFoundException('user not found');

    const existing = await this.muteRepo.findOne({
      where: { muterId, mutedId },
    });
    if (existing) {
      existing.mutePosts = mutePosts;
      existing.muteStories = muteStories;
      return this.muteRepo.save(existing);
    }

    const mute = this.muteRepo.create({
      muterId,
      mutedId,
      mutePosts,
      muteStories,
      createdAt: new Date(),
    });
    return this.muteRepo.save(mute);
  }

  /**
   * Unmute a user. Returns true if a row was removed, false if there was
   * nothing to remove (idempotent).
   */
  async unmute(muterId: string, mutedId: string): Promise<boolean> {
    const result = await this.muteRepo.delete({ muterId, mutedId });
    return (result.affected ?? 0) > 0;
  }

  /** List of users muted by `muterId`. */
  async listMutedBy(muterId: string): Promise<MuteEntity[]> {
    return this.muteRepo.find({
      where: { muterId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Returns the mute row if `muterId` has muted `mutedId`, otherwise null. */
  async getMute(muterId: string, mutedId: string): Promise<MuteEntity | null> {
    return this.muteRepo.findOne({ where: { muterId, mutedId } });
  }

  /** Returns true iff `muterId` has muted `mutedId` for posts. */
  async isMutedPosts(muterId: string, mutedId: string): Promise<boolean> {
    const mute = await this.muteRepo.findOne({ where: { muterId, mutedId } });
    return !!mute && mute.mutePosts;
  }

  /** Returns true iff `muterId` has muted `mutedId` for stories. */
  async isMutedStories(muterId: string, mutedId: string): Promise<boolean> {
    const mute = await this.muteRepo.findOne({ where: { muterId, mutedId } });
    return !!mute && mute.muteStories;
  }

  /**
   * Returns the set of user IDs whose POSTS are muted by `muterId`
   * (used to exclude their content from feed/explore).
   */
  async getMutedPostsIds(muterId: string): Promise<string[]> {
    const rows = await this.muteRepo.find({
      where: { muterId, mutePosts: true },
      select: ['mutedId'],
    });
    return rows.map((m) => m.mutedId);
  }

  /**
   * Returns the set of user IDs whose STORIES are muted by `muterId`
   * (used to exclude their stories from the story tray).
   */
  async getMutedStoriesIds(muterId: string): Promise<string[]> {
    const rows = await this.muteRepo.find({
      where: { muterId, muteStories: true },
      select: ['mutedId'],
    });
    return rows.map((m) => m.mutedId);
  }
}
