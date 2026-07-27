import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { UserEntity } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationEntityType,
} from '../notifications/entities/notification.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string): Promise<FollowEntity> {
    if (followerId === followingId) {
      throw new BadRequestException('cannot follow yourself');
    }
    const target = await this.userRepo.findOne({ where: { id: followingId } });
    if (!target) throw new NotFoundException('user not found');

    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (existing) return existing;

    const follow = this.followRepo.create({
      followerId,
      followingId,
      isAccepted: !target.isPrivate, // auto-accept for public accounts
    });

    const saved = await this.followRepo.save(follow);

    // Best-effort notification to the followed user (skipped if self-follow,
    // which is already blocked above, but kept for safety).
    await this.notifications.create({
      recipientId: followingId,
      actorId: followerId,
      type: NotificationType.Follow,
      entityType: NotificationEntityType.User,
      entityId: followingId,
    });

    return saved;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await this.followRepo.delete({ followerId, followingId });
    return (result.affected ?? 0) > 0;
  }

  async removeFollower(userId: string, followerId: string): Promise<boolean> {
    const result = await this.followRepo.delete({
      followerId,
      followingId: userId,
    });
    return (result.affected ?? 0) > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return !!follow && follow.isAccepted;
  }

  async getFollowers(userId: string): Promise<UserEntity[]> {
    const follows = await this.followRepo.find({
      where: { followingId: userId, isAccepted: true },
      relations: ['follower'],
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(userId: string): Promise<UserEntity[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId, isAccepted: true },
      relations: ['following'],
    });
    return follows.map((f) => f.following);
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId, isAccepted: true },
      select: ['followingId'],
    });
    return follows.map((f) => f.followingId);
  }

  async getFollowersCount(userId: string): Promise<number> {
    return this.followRepo.count({
      where: { followingId: userId, isAccepted: true },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.followRepo.count({
      where: { followerId: userId, isAccepted: true },
    });
  }

  async toggleCloseFriend(
    ownerId: string,
    targetId: string,
    isClose: boolean,
  ): Promise<FollowEntity> {
    const follow = await this.followRepo.findOne({
      where: { followerId: ownerId, followingId: targetId },
    });
    if (!follow) throw new NotFoundException('follow relationship not found');
    follow.isCloseFriend = isClose;
    return this.followRepo.save(follow);
  }

  async getCloseFriends(ownerId: string): Promise<UserEntity[]> {
    const follows = await this.followRepo.find({
      where: { followerId: ownerId, isCloseFriend: true },
      relations: ['following'],
    });
    return follows.map((f) => f.following);
  }

  /**
   * Returns true if `viewerId` is on `ownerId`'s close-friends list.
   *
   * In the current data model, ownerId marks a followed user as close — so
   * `viewerId` is on `ownerId`'s close-friends list iff ownerId follows
   * viewerId AND has set isCloseFriend=true on that follow relationship.
   *
   * Used by the Stories module to gate `close_friends`-visibility stories:
   * only viewers on the author's close-friends list can see them.
   */
  async isOnCloseFriendsList(ownerId: string, viewerId: string): Promise<boolean> {
    if (ownerId === viewerId) return true; // author always sees their own stories
    const count = await this.followRepo.count({
      where: { followerId: ownerId, followingId: viewerId, isCloseFriend: true },
    });
    return count > 0;
  }
}
