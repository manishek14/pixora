# Pixora (پیکسرا)

A bilingual (Persian/English) Instagram-like social platform built with **NestJS**, **GraphQL**, **TypeORM**, and **PostgreSQL** (SQLite for dev).

> **Name**: Pixora — کوتاه، قابل تلفظ در فارسی و انگلیسی، ترکیبی از "Pixel" و "Aurora" (شفق)، الهام‌گرفته از نور و تصویر.

> **Note**: Backend-only project. Interact with the API via the GraphQL Playground at `http://localhost:4000/graphql`, Postman, or any GraphQL client.

## ✨ Features

### Phase 1 — Core Social
- ✅ **Auth**: Register, Login, JWT access + refresh tokens, Logout, refresh-token revocation (bcrypt-hash compare against DB)
- ✅ **Strong password policy**: min 8 chars, requires lowercase + uppercase + digit + special char
- ✅ **Profile**: View profile by username, edit bio/website/avatar, public/private toggle
- ✅ **Posts**: Create/list/delete with multi-image or single video, caption, hashtags (auto-extracted), mentions (auto-extracted), location, archive
- ✅ **Likes**: Toggle like, like counts auto-maintained
- ✅ **Comments**: Threaded replies (parent/child), edit/delete, counts
- ✅ **Follows**: Follow/unfollow, public accounts auto-accept, close-friends list (data layer ready)
- ✅ **Feed**: Personalized feed (own + following), explore feed (trending)
- ✅ **Hashtags**: Search posts by hashtag, inline hashtag parsing in captions
- ✅ **Search**: Search users by username/full name
- ✅ **Uploads**: REST endpoint with Multer (single + multiple), served as static files

### Phase 2 — Stories
- ✅ Stories (24h auto-expire via Cron), Highlights, Reactions
- ✅ Close Friends story segmentation
- ✅ Story views + reactions

### Phase 3 — Discovery
- ✅ Reels (dedicated tab + algorithm)
- ✅ Bookmarks (Saved posts)
- ✅ Enhanced Explore (with hashtag pages)

### Phase 4 — Communication
- ✅ Direct messages (text + media, threads, unread counts, mark-read)
- ✅ Notifications (likes, comments, follows, system)
- ✅ Unified search (users, posts, reels, hashtags)

### Phase 5 — Safety & Discovery
- ✅ Block / Unblock users (filters Likes, Comments, Follows, Messages, Search)
- ✅ Mute users (separately mutes posts, stories, or both; filters feed/stories)
- ✅ Follow suggestions (mutual-friends-first algorithm)
- ✅ Collections (organize saved/bookmarked posts into named folders)

### Phase 6 — Realtime & Push
- ✅ **Realtime messaging** (Socket.io): `message_received`, `message_read`, `message_deleted`, `typing` events
- ✅ **Realtime notifications**: `notification_received` event for likes/comments/follows
- ✅ **Online presence**: in-memory tracker, 30s grace period, broadcasts `presence_update` to mutual follows
- ✅ **Web Push (RFC 8030)**: VAPID-authenticated push notifications for DMs + notifications
- ✅ **Push subscription management**: GraphQL mutations for subscribe / unsubscribe / unsubscribeAll / list
- ✅ **Frontend snippets**: ready-to-paste service worker + Socket.io client + push-subscribe helpers in `frontend-snippets/`

## 🏗️ Architecture

```
pixora/
├── src/
│   ├── modules/
│   │   ├── auth/                JWT + Passport (access + refresh, revocation)
│   │   ├── users/               Profile
│   │   ├── posts/               Posts with hashtag extraction
│   │   ├── likes/               Like toggle
│   │   ├── comments/            Threaded comments
│   │   ├── follows/             Follow + close friends
│   │   ├── feed/                Personalized + explore feed
│   │   ├── uploads/             REST upload with Multer
│   │   ├── stories/             24h stories + reactions + highlights
│   │   ├── highlights/          Story highlights
│   │   ├── reels/               Reels + view tracking
│   │   ├── bookmarks/           Saved posts
│   │   ├── explore/             Hashtag pages + trending
│   │   ├── notifications/       Like/comment/follow/system notifications
│   │   ├── messages/            Direct messages (1-on-1 threads)
│   │   ├── search/              Unified search (users/posts/reels/hashtags)
│   │   ├── blocks/              Block/unblock + filters
│   │   ├── mutes/               Mute posts/stories
│   │   ├── suggestions/         Follow suggestions
│   │   ├── collections/         Organize bookmarks into named folders
│   │   ├── realtime/            Socket.io gateway + presence + event bus
│   │   └── push/                Web Push (VAPID) subscriptions + delivery
│   ├── common/                  Decorators (@Public, @CurrentUser)
│   ├── config/                  Env validation (Joi)
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/                    *.spec.ts — isolated unit/integration tests
│   ├── e2e/                     *.e2e-spec.ts — full AppModule + supertest
│   ├── setup.ts                 Global Jest env (in-memory SQLite, test JWT secrets)
│   └── jest-e2e.json
├── data/                        SQLite DB file (dev) — pixora.db
├── uploads/                     Uploaded media (dev)
├── frontend-snippets/           Ready-to-paste client code (realtime + push)
├── docker-compose.yml           PostgreSQL + Redis + MinIO for prod
└── README.md
```

## 🚀 Quick start (dev with SQLite — no Docker needed)

```bash
npm install
npm rebuild better-sqlite3

# Run in watch mode (or: npm run build && npm start)
npm run start:dev
# → http://localhost:4000/graphql (Playground)
```

SQLite DB is auto-created at `./data/pixora.db`. Schema is synced automatically (synchronize=true in dev).

## 🧪 Tests

```bash
npm test              # unit tests (test/unit/*.spec.ts)
npm run test:e2e      # e2e tests via supertest (test/e2e/*.e2e-spec.ts)
npm run test:cov      # unit tests with coverage report → ./coverage
```

The Jest suite runs against an in-memory SQLite DB (`DB_PATH=:memory:`, configured in `test/setup.ts`) — it never touches the developer's `./data/pixora.db`.

## 🐳 Production setup (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis minio

# Switch backend env to postgres
cat > .env.local <<'EOF'
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixora
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
| `DB_PATH` | `./data/pixora.db` | SQLite DB file path |
| `DB_HOST/PORT/NAME/USER/PASS` | — | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | (change!) | Access token signing secret |
| `JWT_REFRESH_SECRET` | (change!) | Refresh token signing secret |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | `7d` | Refresh token lifetime |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | `50000000` | Max upload size (50MB) |
| `VAPID_PUBLIC_KEY` | (empty) | Web Push VAPID public key — generate with `node scripts/generate-vapid-keys.js` |
| `VAPID_PRIVATE_KEY` | (empty) | Web Push VAPID private key |
| `VAPID_SUBJECT` | `mailto:dev@pixora.app` | Web Push subject (RFC 8030) |
| `PUSH_ENABLED` | `false` | Master switch for Web Push delivery (`true`/`false`) |

## 📋 GraphQL API overview

### Queries
- `me` — current user
- `user(id)` / `userByUsername(username)` — fetch user
- `searchUsers(q, limit)` / `searchPosts` / `searchReels` / `searchHashtags` / `searchAll` — search
- `postsByUser(userId)` / `post(id)` / `postsByHashtag(tag)` — fetch posts
- `feed(limit, offset)` / `exploreFeed(limit, offset)` — feeds
- `comments(postId)` — post comments with replies
- `isLiked(postId)` / `isFollowing(userId)` — toggles
- `followers(userId)` / `following(userId)` / `myCloseFriends()`
- `myThreads` / `thread(id)` / `threadWithUser(userId)` / `unreadMessagesCount` — DM
- `myNotifications` / `myUnreadNotificationsCount` — notifications
- `myBlocks` / `isBlocked(userId)` — block list
- `myMutes` / `isMuted(userId)` — mute list
- `suggestUsers(limit)` — follow suggestions
- `myCollections` / `collection(id)` / `bookmarksByCollection(collectionId)` — collections
- `myPushSubscriptions` — list push-subscribed devices
- `onlineStatus(userIds)` — online/offline status for a batch of users

### Mutations
- `register(input)` / `login(input)` / `refresh(input)` / `logout` — auth
- `updateProfile(input)` / `updateAvatar(url)` — profile
- `createPost` / `updatePost` / `deletePost` / `toggleArchive` — posts
- `toggleLike(postId)` — likes
- `createComment` / `updateComment` / `deleteComment` — comments
- `followUser` / `unfollowUser` / `removeFollower` / `toggleCloseFriend` — follows
- `sendStory` / `viewStory` / `reactToStory` / `deleteStory` — stories
- `createHighlight` / `updateHighlight` / `deleteHighlight` — highlights
- `sendReel` / `viewReel` / `deleteReel` — reels
- `toggleBookmark` / `createCollection` / `addToCollection` / `removeFromCollection` / `deleteCollection` — bookmarks/collections
- `sendMessage` / `markThreadRead` / `deleteMessage` — DM
- `markNotificationRead` / `markAllNotificationsRead` / `deleteNotification` — notifications
- `blockUser(userId)` / `unblockUser(userId)` — blocks
- `muteUser(userId, mutePosts, muteStories)` / `unmuteUser(userId)` — mutes
- `subscribeToPush(input)` / `unsubscribeFromPush(endpoint)` / `unsubscribeAllPush` — Web Push

### Realtime (Socket.io)
Connect to `ws://localhost:4000/` with JWT auth (via `auth.token` or `Authorization: Bearer` header).
Server → client events:
- `message_received` `{ threadId, message }`
- `message_read` `{ threadId, readerId, messageIds }`
- `message_deleted` `{ threadId, messageId }`
- `notification_received` `{ notification }`
- `typing` `{ threadId, userId, isTyping }`
- `presence_update` `{ userId, isOnline, lastSeenAt }`
Client → server events: `typing`, `joinThread`, `leaveThread`.

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
| Realtime | Socket.io (planned) |

## 📝 License

MIT — feel free to use this as a starter or learning project.
