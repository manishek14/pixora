import { Relation } from 'typeorm';
import { UserEntity } from '../users/user.entity';
export declare class FollowEntity {
    id: string;
    createdAt: Date;
    follower: Relation<UserEntity>;
    followerId: string;
    following: Relation<UserEntity>;
    followingId: string;
    isAccepted: boolean;
    isCloseFriend: boolean;
}
