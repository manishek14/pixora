import { UserEntity } from '../../users/user.entity';
export declare class AuthPayload {
    user: UserEntity;
    accessToken: string;
    refreshToken: string;
}
