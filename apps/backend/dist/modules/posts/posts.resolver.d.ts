import { PostEntity } from './post.entity';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { UserEntity } from '../users/user.entity';
export declare class PostsResolver {
    private readonly posts;
    constructor(posts: PostsService);
    post(id: string): Promise<PostEntity>;
    postsByUser(userId: string, limit: number, offset: number): Promise<PostEntity[]>;
    postsByHashtag(tag: string, limit: number, offset: number): Promise<PostEntity[]>;
    createPost(user: UserEntity, input: CreatePostInput): Promise<PostEntity>;
    updatePost(user: UserEntity, id: string, input: UpdatePostInput): Promise<PostEntity>;
    deletePost(user: UserEntity, id: string): Promise<boolean>;
    toggleArchive(user: UserEntity, id: string, archive: boolean): Promise<PostEntity>;
}
