import { Repository } from 'typeorm';
import { PostEntity } from '../posts/post.entity';
import { FollowsService } from '../follows/follows.service';
export interface FeedResult {
    items: PostEntity[];
    hasMore: boolean;
}
export declare class FeedService {
    private readonly postRepo;
    private readonly follows;
    constructor(postRepo: Repository<PostEntity>, follows: FollowsService);
    getFeed(userId: string, limit?: number, offset?: number): Promise<FeedResult>;
    getExploreFeed(limit?: number, offset?: number): Promise<FeedResult>;
}
