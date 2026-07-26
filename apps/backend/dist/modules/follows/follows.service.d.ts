import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { UserEntity } from '../users/user.entity';
export declare class FollowsService {
    private readonly followRepo;
    private readonly userRepo;
    constructor(followRepo: Repository<FollowEntity>, userRepo: Repository<UserEntity>);
    follow(followerId: string, followingId: string): Promise<FollowEntity>;
    unfollow(followerId: string, followingId: string): Promise<boolean>;
    removeFollower(userId: string, followerId: string): Promise<boolean>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowers(userId: string): Promise<UserEntity[]>;
    getFollowing(userId: string): Promise<UserEntity[]>;
    getFollowingIds(userId: string): Promise<string[]>;
    getFollowersCount(userId: string): Promise<number>;
    getFollowingCount(userId: string): Promise<number>;
    toggleCloseFriend(ownerId: string, targetId: string, isClose: boolean): Promise<FollowEntity>;
    getCloseFriends(ownerId: string): Promise<UserEntity[]>;
}
