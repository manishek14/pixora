import { FeedService } from './feed.service';
import { FeedResult } from './feed-result';
import { UserEntity } from '../users/user.entity';
export declare class FeedResolver {
    private readonly feedService;
    constructor(feedService: FeedService);
    feed(user: UserEntity, limit: number, offset: number): Promise<FeedResult>;
    exploreFeed(limit: number, offset: number): Promise<FeedResult>;
}
