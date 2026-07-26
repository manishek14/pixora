import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload';
export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
}
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly config;
    private readonly logger;
    constructor(userRepo: Repository<UserEntity>, jwtService: JwtService, config: ConfigService);
    register(input: RegisterInput): Promise<AuthPayload>;
    login(input: LoginInput): Promise<AuthPayload>;
    refresh(refreshToken: string): Promise<AuthPayload>;
    logout(userId: string): Promise<boolean>;
    private buildPayload;
}
