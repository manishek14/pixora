import { Relation } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { LikeEntity } from '../likes/like.entity';
import { CommentEntity } from '../comments/comment.entity';
import { FollowEntity } from '../follows/follow.entity';
export declare class UserEntity {
    id: string;
    username: string;
    email: string;
    password: string;
    refreshToken?: string;
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    website?: string;
    isPrivate: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    posts: Relation<PostEntity>[];
    likes: Relation<LikeEntity>[];
    comments: Relation<CommentEntity>[];
    following: Relation<FollowEntity>[];
    followers: Relation<FollowEntity>[];
}
