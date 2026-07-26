import { Repository } from 'typeorm';
import { PostEntity } from './post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
export declare class PostsService {
    private readonly postRepo;
    constructor(postRepo: Repository<PostEntity>);
    create(authorId: string, input: CreatePostInput): Promise<PostEntity>;
    findById(id: string): Promise<PostEntity>;
    findByAuthor(authorId: string, limit?: number, offset?: number): Promise<PostEntity[]>;
    update(postId: string, authorId: string, input: UpdatePostInput): Promise<PostEntity>;
    delete(postId: string, authorId: string): Promise<boolean>;
    archive(postId: string, authorId: string, archive: boolean): Promise<PostEntity>;
    findByHashtag(tag: string, limit?: number, offset?: number): Promise<PostEntity[]>;
    incrementLikes(postId: string, by?: number): Promise<void>;
    decrementLikes(postId: string, by?: number): Promise<void>;
    incrementComments(postId: string, by?: number): Promise<void>;
    decrementComments(postId: string, by?: number): Promise<void>;
}
