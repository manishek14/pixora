import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<UserEntity>);
    findById(id: string): Promise<UserEntity>;
    findByUsername(username: string): Promise<UserEntity>;
    updateAvatar(userId: string, url: string): Promise<UserEntity>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<UserEntity>;
    search(query: string, limit?: number): Promise<UserEntity[]>;
}
