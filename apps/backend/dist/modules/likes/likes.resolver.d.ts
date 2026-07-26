import { LikeEntity } from './like.entity';
import { LikesService } from './likes.service';
import { UserEntity } from '../users/user.entity';
export declare class LikesResolver {
    private readonly likes;
    constructor(likes: LikesService);
    toggleLike(user: UserEntity, postId: string): Promise<boolean>;
    isLiked(user: UserEntity, postId: string): Promise<boolean>;
    likers(postId: string): Promise<LikeEntity[]>;
}
