import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh.input';
import { AuthPayload } from './dto/auth-payload';
import { UserEntity } from '../users/user.entity';
export declare class AuthResolver {
    private readonly auth;
    constructor(auth: AuthService);
    register(input: RegisterInput): Promise<AuthPayload>;
    login(input: LoginInput): Promise<AuthPayload>;
    refresh(input: RefreshTokenInput): Promise<AuthPayload>;
    logout(user: UserEntity): Promise<boolean>;
    me(user: UserEntity): Promise<UserEntity>;
}
