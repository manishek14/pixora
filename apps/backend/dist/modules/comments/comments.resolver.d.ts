import { CommentEntity } from './comment.entity';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UserEntity } from '../users/user.entity';
export declare class CommentsResolver {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    comments(postId: string): Promise<CommentEntity[]>;
    createComment(user: UserEntity, input: CreateCommentInput): Promise<CommentEntity>;
    updateComment(user: UserEntity, id: string, text: string): Promise<CommentEntity>;
    deleteComment(user: UserEntity, id: string): Promise<boolean>;
}
