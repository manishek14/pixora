import { FollowsService } from './follows.service';
import { UserEntity } from '../users/user.entity';
export declare class FollowsResolver {
    private readonly followsService;
    constructor(followsService: FollowsService);
    followUser(user: UserEntity, targetId: string): Promise<boolean>;
    unfollowUser(user: UserEntity, targetId: string): Promise<boolean>;
    removeFollower(user: UserEntity, followerId: string): Promise<boolean>;
    isFollowing(user: UserEntity, targetId: string): Promise<boolean>;
    followers(userId: string): Promise<UserEntity[]>;
    following(userId: string): Promise<UserEntity[]>;
    toggleCloseFriend(user: UserEntity, targetId: string, isClose: boolean): Promise<boolean>;
    myCloseFriends(user: UserEntity): Promise<UserEntity[]>;
}
