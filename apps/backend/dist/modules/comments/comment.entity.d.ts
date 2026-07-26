import { Relation } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
export declare class CommentEntity {
    id: string;
    text: string;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
    user: Relation<UserEntity>;
    userId: string;
    post: Relation<PostEntity>;
    postId: string;
    parent: Relation<CommentEntity> | null;
    parentId: string | null;
    replies: Relation<CommentEntity>[];
}
