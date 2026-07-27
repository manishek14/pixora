import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../users/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    const exists = await this.userRepo.findOne({
      where: [{ email: input.email }, { username: input.username }],
    });
    if (exists) {
      throw new ConflictException('email or username already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = this.userRepo.create({
      username: input.username.toLowerCase(),
      email: input.email.toLowerCase(),
      password: passwordHash,
      fullName: input.fullName,
    });

    const saved = await this.userRepo.save(user);
    return this.buildPayload(saved);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email: input.email.toLowerCase() })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('invalid credentials');
    }

    return this.buildPayload(user);
  }

  async refresh(refreshToken: string): Promise<AuthPayload> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') as string,
      });
    } catch {
      throw new UnauthorizedException('invalid or expired refresh token');
    }

    // Fetch user WITH the stored (hashed) refresh token for revocation check
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.refreshToken')
      .where('u.id = :id', { id: payload.sub })
      .getOne();
    if (!user) throw new UnauthorizedException('user not found');

    // Reject if user has logged out (refresh token cleared in DB) OR
    // if the provided token doesn't match the stored hash (rotated elsewhere)
    if (!user.refreshToken) {
      throw new UnauthorizedException('session revoked, please log in again');
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) {
      throw new UnauthorizedException('session revoked, please log in again');
    }

    return this.buildPayload(user);
  }

  async logout(userId: string): Promise<boolean> {
    await this.userRepo.update(userId, { refreshToken: '' });
    return true;
  }

  private async buildPayload(user: UserEntity): Promise<AuthPayload> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d') as any,
    });

    // Persist refresh token (hashed)
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshToken: hashed });

    return { user, accessToken, refreshToken };
  }
}
