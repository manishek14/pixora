import { Relation } from 'typeorm';
import { UserEntity } from '../users/user.entity';
export declare class PostEntity {
    id: string;
    caption?: string;
    mediaUrls: string[];
    hashtags: string[];
    mentions: string[];
    location?: string;
    isReel: boolean;
    likesCount: number;
    commentsCount: number;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: Relation<UserEntity>;
    authorId: string;
}
