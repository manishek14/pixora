import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { PostsService } from '../posts/posts.service';
export declare class CommentsService {
    private readonly commentRepo;
    private readonly postsService;
    constructor(commentRepo: Repository<CommentEntity>, postsService: PostsService);
    create(userId: string, input: CreateCommentInput): Promise<CommentEntity>;
    findByPost(postId: string, limit?: number): Promise<CommentEntity[]>;
    update(commentId: string, userId: string, text: string): Promise<CommentEntity>;
    delete(commentId: string, userId: string): Promise<boolean>;
    countByPost(postId: string): Promise<number>;
}
