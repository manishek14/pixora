# Lenz (لنز)

A bilingual (Persian/English) Instagram-like social platform built with **NestJS**, **GraphQL**, **TypeORM**, and **PostgreSQL** (SQLite for dev).

> **Name**: Lenz — کوتاه، قابل تلفظ در فارسی و انگلیسی، مرتبط با تصویر و عکاسی.

> **Note**: Backend-only project. Interact with the API via the GraphQL Playground at `http://localhost:4000/graphql`, Postman, or any GraphQL client.

## ✨ Features

### Phase 1 — Core Social (current)
- ✅ **Auth**: Register, Login, JWT access + refresh tokens, Logout, refresh-token revocation (bcrypt-hash compare against DB)
- ✅ **Strong password policy**: min 8 chars, requires lowercase + uppercase + digit + special char (enforced server-side via class-validator)
- ✅ **Profile**: View profile by username, edit bio/website/avatar, public/private toggle
- ✅ **Posts**: Create/list/delete with multi-image or single video, caption, hashtags (auto-extracted), mentions (auto-extracted), location, archive
- ✅ **Likes**: Toggle like, like counts auto-maintained
- ✅ **Comments**: Threaded replies (parent/child), edit/delete, counts
- ✅ **Follows**: Follow/unfollow, public accounts auto-accept, close-friends list (data layer ready)
- ✅ **Feed**: Personalized feed (own + following), explore feed (trending)
- ✅ **Hashtags**: Search posts by hashtag, inline hashtag parsing in captions
- ✅ **Search**: Search users by username/full name
- ✅ **Uploads**: REST endpoint with Multer (single + multiple), served as static files
- ✅ **Correct GraphQL types**: All pagination args use `Int` (not `Float`)
- ✅ **Jest test suite**: Unit tests for AuthService + DTO validation, e2e tests for the GraphQL surface

### Phase 2 (planned)
- 🔜 Stories (24h auto-expire via Cron), Highlights, Reactions
- 🔜 Close Friends story segmentation

### Phase 3 (planned)
- 🔜 Reels (dedicated tab + algorithm)
- 🔜 Bookmarks (Saved posts)
- 🔜 Enhanced Explore (with hashtag pages)

### Phase 4 (planned)
- 🔜 Direct messages (Socket.io realtime)
- 🔜 Online presence, typing indicator, seen receipts
- 🔜 Voice + Video messages

## 🏗️ Architecture

```
my-project/
├── src/                       NestJS source root
│   ├── modules/
│   │   ├── auth/              JWT + Passport (access + refresh, revocation)
│   │   ├── users/             Profile
│   │   ├── posts/             Posts with hashtag extraction
│   │   ├── likes/             Like toggle
│   │   ├── comments/          Threaded comments
│   │   ├── follows/           Follow + close friends
│   │   ├── feed/              Personalized + explore feed
│   │   └── uploads/           REST upload with Multer
│   ├── common/                Decorators (@Public, @CurrentUser)
│   ├── config/                Env validation (Joi)
│   ├── app.module.ts
│   └── main.ts
├── test/                      Jest test suite
│   ├── unit/                  *.spec.ts — isolated unit/integration tests
│   ├── e2e/                   *.e2e-spec.ts — full AppModule + supertest
│   ├── setup.ts               Global Jest env (in-memory SQLite, test JWT secrets)
│   └── jest-e2e.json          Jest config for e2e tests
├── data/                      SQLite DB file (dev)
├── uploads/                   Uploaded media (dev)
├── dist/                      Build output (gitignored)
├── coverage/                  Test coverage (gitignored)
├── docker-compose.yml         PostgreSQL + Redis + MinIO for prod
├── nest-cli.json
├── tsconfig.json              TypeScript config (src + test)
├── tsconfig.build.json        TypeScript config for nest build (src only)
├── jest.config.js             Jest config for unit tests
├── package.json
├── .env                       Default env (override with .env.local)
└── README.md
```

## 🚀 Quick start (dev with SQLite — no Docker needed)

```bash
# Install deps + rebuild native bindings (better-sqlite3)
npm install
npm rebuild better-sqlite3

# Run in watch mode (or: npm run build && npm start)
npm run start:dev
# → http://localhost:4000/graphql (Playground)
```

SQLite DB is auto-created at `./data/lenz.db`. Schema is synced automatically (synchronize=true in dev).

## 🧪 Tests

```bash
npm test              # unit tests (test/unit/*.spec.ts)
npm run test:e2e      # e2e tests via supertest (test/e2e/*.e2e-spec.ts)
npm run test:cov      # unit tests with coverage report → ./coverage
```

The Jest suite runs against an in-memory SQLite DB (`DB_PATH=:memory:`, configured in `test/setup.ts`) — it never touches the developer's `./data/lenz.db`.

### What's covered
- **Unit** (`test/unit/auth.service.spec.ts`): `RegisterInput` validation (strong-password regex, email format, username charset), `AuthService.register/login/refresh/logout` with a real in-memory DB.
- **E2E** (`test/e2e/app.e2e-spec.ts`): Full AppModule boot, GraphQL register/login/me/feed — proves the Int-pagination fix that previously caused `درخواست نامعتبر است` stays fixed.

## 🐳 Production setup (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis minio

# Switch backend env to postgres
cat > .env.local <<'EOF'
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lenz
DB_USER=postgres
DB_PASS=postgres
NODE_ENV=production
EOF
npm run build
npm run start:prod
```

## 🔑 Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 4000 | Backend port |
| `DB_TYPE` | `better-sqlite3` | `sqlite` / `better-sqlite3` / `postgres` |
| `DB_PATH` | `./data/lenz.db` | SQLite DB file path |
| `DB_HOST/PORT/NAME/USER/PASS` | — | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | (change!) | Access token signing secret |
| `JWT_REFRESH_SECRET` | (change!) | Refresh token signing secret |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | `7d` | Refresh token lifetime |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | `50000000` | Max upload size (50MB) |

## 📋 GraphQL API overview

### Queries
- `me` — current user
- `user(id)` / `userByUsername(username)` — fetch user
- `searchUsers(q, limit)` — search
- `postsByUser(userId)` / `post(id)` / `postsByHashtag(tag)` — fetch posts
- `feed(limit, offset)` / `exploreFeed(limit, offset)` — feeds (limit/offset are `Int`)
- `comments(postId)` — post comments with replies
- `isLiked(postId)` / `isFollowing(userId)` — toggles
- `followers(userId)` / `following(userId)` / `myCloseFriends()` — follow graph

### Mutations
- `register(input)` / `login(input)` / `refresh(input)` / `logout` — auth
  - `RegisterInput.password` enforces strong-password regex
- `updateProfile(input)` / `updateAvatar(url)` — profile
- `createPost(input)` / `updatePost(id, input)` / `deletePost(id)` / `toggleArchive(id, archive)` — posts
- `toggleLike(postId)` — likes
- `createComment(input)` / `updateComment(id, text)` / `deleteComment(id)` — comments
- `followUser(userId)` / `unfollowUser(userId)` / `removeFollower(followerId)` / `toggleCloseFriend(userId, isClose)` — follows

### REST endpoints
- `POST /api/uploads/single` — single file upload (multipart `file`)
- `POST /api/uploads/multiple` — up to 10 files (multipart `files`)
- `GET /uploads/<filename>` — static file serving

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| Backend | NestJS 11, Apollo Server 5, GraphQL 16 |
| ORM | TypeORM 0.3 (PostgreSQL 16 / SQLite) |
| Auth | Passport-JWT, bcryptjs |
| Validation | class-validator + Joi (env) |
| Tests | Jest 30, ts-jest, supertest |
| Realtime | Socket.io (planned for Phase 4) |

## 📝 License

MIT — feel free to use this as a starter or learning project.
