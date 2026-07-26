import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { PostsService } from '../posts/posts.service';
export declare class LikesService {
    private readonly likeRepo;
    private readonly postsService;
    constructor(likeRepo: Repository<LikeEntity>, postsService: PostsService);
    toggle(userId: string, postId: string): Promise<boolean>;
    isLiked(userId: string, postId: string): Promise<boolean>;
    getLikers(postId: string): Promise<LikeEntity[]>;
    countByPost(postId: string): Promise<number>;
}
