# Lenz — Work Log

## Project Overview
Building Lenz — an Instagram-like bilingual (fa/en) social platform with NestJS + GraphQL + TypeORM + Next.js.

## Decisions
- **Name**: Lenz (لنز) — short, pronounceable in fa/en, image-related
- **Database**: PostgreSQL + TypeORM (per user request); SQLite (better-sqlite3) used for local dev
- **Frontend**: Next.js + React (EJS dropped because the combo is non-standard)
- **Auth**: JWT access (15m) + refresh (7d) in localStorage, refresh-token rotation
- **Files**: Local + Multer (dev), MinIO + S3 ready (prod)
- **Stories**: 24h + Highlight + Close Friends + Reaction (Phase 2)
- **Direct**: Text + Image + Voice + Video, Seen + Typing, Online Presence (Phase 4)
- **i18n**: Bilingual fa/en with RTL/LTR switching
- **Phase 1 (MVP)**: Auth, Profile, Posts, Likes, Comments, Follow, Feed — all implemented

---

Task ID: 1
Agent: main
Task: Setup backend NestJS project (TypeORM + PostgreSQL/SQLite + GraphQL + JWT config)

Work Log:
- Created `/home/z/my-project/apps/backend` workspace
- Installed NestJS 11, TypeORM, GraphQL (Apollo), JWT, Passport, bcryptjs, Multer
- Wrote `tsconfig.json`, `nest-cli.json`, `.env`
- Set up env validation with Joi (`config/env.validation.ts`)
- Configured TypeORM with `better-sqlite3` (dev) and `postgres` (prod) support
- Set up Apollo GraphQL with auto-schema generation

Stage Summary:
- Backend skeleton ready, dependencies installed, build pipeline working
- SQLite for local dev (no Docker required), PostgreSQL for prod

---

Task ID: 2
Agent: main
Task: Docker Compose for PostgreSQL + Redis

Work Log:
- Created `/home/z/my-project/docker-compose.yml` with PostgreSQL 16, Redis 7, MinIO
- Used named volumes for persistence
- Added healthcheck for PostgreSQL

Stage Summary:
- Production-ready docker-compose available for PostgreSQL switch
- Redis will be used in Phase 4 (Direct chat presence/cache)
- MinIO ready for S3-compatible media storage (replace Multer local)

---

Task ID: 3-7
Agent: main
Task: Backend modules (Auth, Users, Posts, Likes, Comments, Follows, Feed)

Work Log:
- Auth: register/login/refresh/logout mutations, GqlAuthGuard, JwtStrategy, @Public decorator
- Users: CRUD, search, profile update, avatar update
- Posts: create (with auto hashtag/mention extraction), update, delete, archive, hashtag search
- Likes: toggle, count maintenance
- Comments: threaded replies via self-reference (parent/child), edit/delete
- Follows: follow/unfollow (auto-accept for public accounts), close friends list, remove follower
- Feed: personalized feed (following + own), explore feed (trending)
- Uploads: REST controller with Multer memory storage, image/video validation, UUID filename
- Entities: User, Post, Like, Comment, Follow — all with proper relations and indexes

Stage Summary:
- All Phase 1 resolvers and services implemented
- GraphQL schema auto-generated at `src/schema.gql`
- E2E smoke test passes (register, follow, create post, like, comment, feed, hashtag search)

---

Task ID: 8-11
Agent: main
Task: Frontend Next.js 15 with Tailwind, Apollo, i18n

Work Log:
- Created `/home/z/my-project/apps/frontend` with Next.js 15 App Router + React 19
- Installed Apollo Client 3 + experimental Next.js support, Tailwind 3, lucide-react
- Built i18n context provider (fa/en) with RTL/LTR auto-switching, localStorage persistence
- Built Auth context with `useQuery(me)` for current user, login/logout methods
- Built reusable UI: Button, Input, Textarea, Avatar
- Built layout: Sidebar (desktop), MobileNav (mobile bottom bar), AppShell (route guard)
- Built pages:
  - `/login`, `/register` — bilingual auth forms with show/hide password
  - `/` — Home feed with stories bar, PostCard with like/comment/save actions
  - `/explore` — Grid view with hover stats
  - `/search` — User search with debounced queries
  - `/create` — Multi-file upload via REST, caption with hashtag/mention parsing, location
  - `/profile/[username]` — Profile header, stats, tabs (posts/reels/saved), grid
  - `/post/[id]` — Detail view with side panel, threaded comments, like + comment actions
  - `/hashtag/[tag]` — Hashtag page with grid
  - `/direct` — Placeholder for Phase 4 (Socket.io)
- Configured Next.js rewrites to proxy `/uploads/*` and `/api/*` to backend (avoids CORS)
- Tailwind theme with Instagram-inspired Lenz palette + gradient

Stage Summary:
- All Phase 1 pages implemented and building successfully
- Build output: 10 routes, ~155KB First Load JS average
- Apollo client injects JWT automatically via auth middleware link
- Bilingual support fully working (RTL/LTR toggle in sidebar)

---

Task ID: 12
Agent: main
Task: Integration test + run both apps

Work Log:
- Started backend on :4000 — GraphQL Playground accessible
- Started frontend on :3000 — all routes return HTTP 200
- Wrote and ran `/home/z/my-project/scripts/smoke-test.sh` end-to-end:
  1. Register two users (sara, reza)
  2. Sara follows Reza
  3. Reza creates post with hashtags + mention
  4. Sara likes the post
  5. Sara comments on the post
  6. Sara reads her feed (shows Reza's post with hashtags, likes, comments)
  7. Search posts by hashtag (#first) — returns the post
- All 8 steps pass
- Fixed two bugs found during testing:
  - `createComment` didn't reload `user` relation → fixed with explicit reload
  - `postsByHashtag` used `string_to_array` (PostgreSQL-only) → switched to LIKE patterns (cross-DB)

Stage Summary:
- Lenz Phase 1 (Core Social) is fully working end-to-end
- Both apps running: backend http://localhost:4000, frontend http://localhost:3000
- E2E smoke test script saved at `/home/z/my-project/scripts/smoke-test.sh`
- Ready for Phase 2 development (Stories, Reels, Direct)
