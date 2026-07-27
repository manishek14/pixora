import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * End-to-end smoke test.
 *
 * Boots the full AppModule (real GraphQL + TypeORM + JWT wiring) against an
 * in-memory SQLite database (configured in test/setup.ts) and exercises the
 * public GraphQL surface: register → login → me query → feed query.
 *
 * This is the single source of truth that proves the NestJS restructure works
 * end-to-end after migrating from apps/backend → project root.
 */
describe('GraphQL E2E (AppModule, in-memory SQLite)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = (query: string, variables?: Record<string, unknown>, token?: string) => {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  it('registers a new user with a strong password', async () => {
    const res = await gql(
      `mutation Register($input: RegisterInput!) {
        register(input: $input) {
          user { id username email }
          accessToken
          refreshToken
        }
      }`,
      {
        input: {
          username: 'e2e_user',
          email: 'e2e@example.com',
          password: 'Str0ng!Pass',
          fullName: 'E2E User',
        },
      },
    );

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.register.user.username).toBe('e2e_user');
    expect(res.body.data.register.accessToken).toBeTruthy();

    accessToken = res.body.data.register.accessToken;
    userId = res.body.data.register.user.id;
  });

  it('rejects registration with a weak password', async () => {
    const res = await gql(
      `mutation Register($input: RegisterInput!) {
        register(input: $input) { user { id } }
      }`,
      {
        input: {
          username: 'e2e_weak',
          email: 'e2e_weak@example.com',
          password: 'password123', // no uppercase, no special char
        },
      },
    );

    // Validation errors come back as GraphQL errors, not HTTP 4xx, because the
    // global ValidationPipe throws BadRequestException which Apollo surfaces.
    expect(res.body.errors).toBeTruthy();
    // Apollo may either set `data.register = null` or omit `data` entirely
    // depending on the error category — both are acceptable.
    expect(res.body.data?.register ?? null).toBeNull();
  });

  it('logs in with the registered credentials', async () => {
    const res = await gql(
      `mutation Login($input: LoginInput!) {
        login(input: $input) { user { id username } accessToken }
      }`,
      { input: { email: 'e2e@example.com', password: 'Str0ng!Pass' } },
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.login.user.username).toBe('e2e_user');
    expect(res.body.data.login.accessToken).toBeTruthy();
  });

  it('returns the current user from `me` query with a valid access token', async () => {
    const res = await gql(
      `query Me { me { id username email fullName } }`,
      undefined,
      accessToken,
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.me.id).toBe(userId);
    expect(res.body.data.me.email).toBe('e2e@example.com');
  });

  it('rejects `me` query without an access token', async () => {
    const res = await gql(`query Me { me { id } }`);
    expect(res.body.errors).toBeTruthy();
    // Apollo may either set `data.me = null` or omit `data` entirely on auth
    // failure — both are acceptable.
    expect(res.body.data?.me ?? null).toBeNull();
  });

  it('returns an empty feed for a fresh user (uses Int pagination args)', async () => {
    const res = await gql(
      `query Feed($limit: Int, $offset: Int) {
        feed(limit: $limit, offset: $offset) {
          items { id caption }
          hasMore
        }
      }`,
      { limit: 10, offset: 0 },
      accessToken,
    );

    // This is the exact query that used to fail with "درخواست نامعتبر است" before
    // the Int-type fix — must keep working forever.
    expect(res.body.errors).toBeUndefined();
    expect(Array.isArray(res.body.data.feed.items)).toBe(true);
    expect(res.body.data.feed.hasMore).toBe(false);
  });
});
