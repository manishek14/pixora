import { Relation } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
export declare class LikeEntity {
    id: string;
    createdAt: Date;
    user: Relation<UserEntity>;
    userId: string;
    post: Relation<PostEntity>;
    postId: string;
}
