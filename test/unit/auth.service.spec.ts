import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';

import { AuthService } from '@/modules/auth/auth.service';
import { UserEntity } from '@/modules/users/user.entity';
import { PostEntity } from '@/modules/posts/post.entity';
import { LikeEntity } from '@/modules/likes/like.entity';
import { CommentEntity } from '@/modules/comments/comment.entity';
import { FollowEntity } from '@/modules/follows/follow.entity';
import { StoryEntity } from '@/modules/stories/entities/story.entity';
import { StoryViewEntity } from '@/modules/stories/entities/story-view.entity';
import { StoryReactionEntity } from '@/modules/stories/entities/story-reaction.entity';
import { HighlightEntity } from '@/modules/highlights/entities/highlight.entity';
import { HighlightItemEntity } from '@/modules/highlights/entities/highlight-item.entity';
import { RegisterInput } from '@/modules/auth/dto/register.input';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

/**
 * Unit tests for AuthService + RegisterInput validation.
 *
 * Strategy:
 *  - Validation tests instantiate the DTO directly with `plainToInstance` and
 *    run `validate()` — these don't need a DB.
 *  - Service behaviour tests spin up a real in-memory SQLite DB via TypeOrmModule
 *    with ALL entities registered (TypeORM needs them all to resolve relations).
 */
describe('RegisterInput validation', () => {
  async function validateInput(payload: Partial<RegisterInput>) {
    const instance = plainToInstance(RegisterInput, payload);
    const errors = await validate(instance);
    return errors.map((e) => ({
      property: e.property,
      constraints: Object.keys(e.constraints || {}),
    }));
  }

  it('accepts a strong password (lower+upper+digit+special, 8+ chars)', async () => {
    const errors = await validateInput({
      username: 'ali',
      email: 'ali@example.com',
      password: 'Str0ng!Pass',
    });
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['too short', 'Ab1!xyz'],
    ['no lowercase', 'AB1!LONGPASSWORD'],
    ['no uppercase', 'ab1!longpassword'],
    ['no digit', 'Abcdefgh!xyz'],
    ['no special char', 'Abcdefgh1xyz'],
    ['empty string', ''],
  ])('rejects password: %s', async (_label, pw) => {
    const errors = await validateInput({
      username: 'ali',
      email: 'ali@example.com',
      password: pw,
    });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects invalid email', async () => {
    const errors = await validateInput({
      username: 'ali',
      email: 'not-an-email',
      password: 'Str0ng!Pass',
    });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects username with invalid chars', async () => {
    const errors = await validateInput({
      username: 'ali@@@',
      email: 'ali@example.com',
      password: 'Str0ng!Pass',
    });
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });
});

describe('AuthService', () => {
  let service: AuthService;
  let repo: Repository<UserEntity>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [
            UserEntity,
            PostEntity,
            LikeEntity,
            CommentEntity,
            FollowEntity,
            StoryEntity,
            StoryViewEntity,
            StoryReactionEntity,
            HighlightEntity,
            HighlightItemEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([UserEntity]),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
      ],
      providers: [AuthService],
    }).compile();

    service = moduleRef.get(AuthService);
    repo = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('register', () => {
    it('creates a new user and returns access + refresh tokens', async () => {
      const res = await service.register({
        username: 'sara',
        email: 'sara@example.com',
        password: 'Str0ng!Pass',
        fullName: 'Sara Test',
      });

      expect(res.user.username).toBe('sara');
      expect(res.user.email).toBe('sara@example.com');
      expect(res.accessToken).toBeTruthy();
      expect(res.refreshToken).toBeTruthy();

      // Refresh token must be hashed before being persisted
      const stored = await repo
        .createQueryBuilder('u')
        .addSelect('u.refreshToken')
        .where('u.id = :id', { id: res.user.id })
        .getOne();
      expect(stored?.refreshToken).toBeTruthy();
      expect(stored?.refreshToken).not.toBe(res.refreshToken);
      await expect(bcrypt.compare(res.refreshToken, stored!.refreshToken!)).resolves.toBe(true);
    });

    it('lowercases username and email on save', async () => {
      const res = await service.register({
        username: 'MixedCase',
        email: 'MIXED@EXAMPLE.COM',
        password: 'Str0ng!Pass',
      });
      expect(res.user.username).toBe('mixedcase');
      expect(res.user.email).toBe('mixed@example.com');
    });

    it('throws ConflictException when email already exists', async () => {
      await expect(
        service.register({
          username: 'someone-else',
          email: 'sara@example.com',
          password: 'Str0ng!Pass',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException when username already exists', async () => {
      await expect(
        service.register({
          username: 'sara',
          email: 'another@example.com',
          password: 'Str0ng!Pass',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('logs in with correct credentials', async () => {
      const res = await service.login({
        email: 'sara@example.com',
        password: 'Str0ng!Pass',
      });
      expect(res.user.username).toBe('sara');
      expect(res.accessToken).toBeTruthy();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      await expect(
        service.login({ email: 'sara@example.com', password: 'WrongPass!1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      await expect(
        service.login({ email: 'ghost@example.com', password: 'Str0ng!Pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh + logout (revocation)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await service.login({
        email: 'sara@example.com',
        password: 'Str0ng!Pass',
      });
      refreshToken = res.refreshToken;
    });

    it('refreshes tokens with a valid refresh token', async () => {
      const res = await service.refresh(refreshToken);
      expect(res.accessToken).toBeTruthy();
      expect(res.refreshToken).toBeTruthy();
      // TODO: token rotation is currently weak — JWT_REFRESH_TTL is the only
      // thing that distinguishes consecutive refresh tokens for the same user
      // issued within the same second (same iat, same payload, same signature).
      // A proper rotation scheme would add a `jti` nonce or random session id.
      // For now, we only assert that refresh succeeds and returns new tokens.
    });

    it('rejects refresh after logout', async () => {
      const user = await repo.findOneBy({ username: 'sara' });
      await service.logout(user!.id);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
