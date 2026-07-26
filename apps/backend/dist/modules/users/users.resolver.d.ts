import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';
export declare class UsersResolver {
    private readonly users;
    constructor(users: UsersService);
    user(id: string): Promise<UserEntity>;
    userByUsername(username: string): Promise<UserEntity>;
    searchUsers(q: string, limit: number): Promise<UserEntity[]>;
    updateProfile(user: UserEntity, input: UpdateProfileInput): Promise<UserEntity>;
    updateAvatar(user: UserEntity, url: string): Promise<UserEntity>;
}
