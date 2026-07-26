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

---
Task ID: 13-15
Agent: main
Task: Frontend refactor — Fix "Failed to fetch" + Liquid Glass theme system + Auth redesign

Work Log:
- Backend audit: confirmed schema and resolvers are fully synced with frontend GraphQL queries
- Fixed security bug in `auth.service.ts refresh()`: now validates refresh token against stored bcrypt hash, so revoked tokens (post-logout) are actually rejected with "session revoked, please log in again"
- Next.js config: added `/api/graphql` rewrite → `http://localhost:4000/graphql` (eliminates CORS + "Failed to fetch" — browser only talks to its own origin)
- Apollo Client rewrite (`apollo-provider.tsx`):
  * HttpLink now uses `/api/graphql` (proxied)
  * AuthLink: injects `Bearer <token>` on every operation
  * ErrorLink: catches 401 → calls `tryRefreshToken()` → retries once with new token; non-401 errors mapped to Persian via `error-map.ts` and shown as toast
  * WeakSet prevents infinite retry loops
- New `lib/refresh.ts`: serialized refresh-token fetch (single-flight) so concurrent 401s only trigger one refresh
- New `lib/error-map.ts`: regex-based mapping of backend messages → Persian (network errors, auth errors, validation, etc.)
- New `lib/toast-store.ts` + `components/ui/toaster.tsx`: lightweight toast system (useSyncExternalStore, no provider needed), liquid-glass-styled, top-center stack
- next-themes installed; `lib/theme-provider.tsx` wraps app with `attribute="class"`, `defaultTheme="dark"`, `enableSystem`
- `app/layout.tsx`: added inline no-flash script + `<Toaster />` mounted once at root
- `globals.css` rewrite (300+ lines):
  * Dark (default) + Light + Auto(theme=system) theme tokens via CSS variables
  * Telegram Blue accent (#2AABEE dark / #1E95D6 light)
  * Liquid glass utilities: `.glass-card`, `.glass-card--raised`, `.glass-card--subtle`, `.glass-input`, `.glass-btn-primary`, `.glass-btn-ghost`, `.glass-dock`
  * Specular highlight via ::before, ambient aurora background via body::before
  * Tailwind dark mode = 'class' (works with next-themes)
- `tailwind.config.ts`: colors mapped to CSS variables for theme-aware utility classes
- UI components updated: Button (uses glass-btn-primary/ghost), Input/Textarea (uses glass-input), Avatar (dark-mode-safe colors)
- New `ThemeToggle` component (compact single-button and segmented variants)
- Login + Register pages redesigned:
  * Glass-card with --raised variant, specular shine
  * Decorative blurred blobs (Telegram Blue) in background
  * Leading icons on inputs (Mail, Lock, User, AtSign)
  * Top-right ThemeToggle
  * Submit button uses glass-btn-primary with gradient + glow
  * On success: toast.success(welcomeBack) + redirect
  * On error: inline error box + toast.error(persian message)
- Sidebar redesigned:
  * Glass dock surface (rounded-3xl, m-3 inset from screen edge)
  * Active nav item: bg-lenz-primary/15 + drop-shadow glow
  * Footer: ThemeToggle compact, locale toggle, logout (rose), user mini-card
- MobileNav redesigned: floating glass dock at bottom, m-3 inset
- AppShell: loading state shows animated logo + loading bar; redirects to /login when unauthenticated
- i18n: added theme.toggle, theme.dark, theme.light, theme.system keys (fa/en)
- Created `scripts/dev-up.sh`: starts backend + frontend together, waits, runs smoke test, saves PIDs

Stage Summary:
- "Failed to fetch" root cause was Apollo Client hitting `localhost:4000` directly. Fixed via Next.js proxy + Apollo Link chain.
- Refresh-on-401 auto-refresh logic implemented and tested.
- Backend refresh bug fixed: revoked refresh tokens now actually rejected.
- All auth flows verified E2E via proxied /api/graphql:
  * register → returns JWT ✓
  * login → returns JWT ✓
  * me with access token ✓
  * logout → revokes refresh in DB ✓
  * refresh AFTER logout → 401 "session revoked" ✓ (previously was a bug!)
  * refresh with fresh login → returns new access token ✓
  * wrong password → 401 "invalid credentials" → mapped to "ایمیل یا رمز عبور اشتباه است." ✓
  * duplicate registration → 409 → mapped to "این ایمیل یا نام کاربری قبلاً ثبت شده است." ✓
- Liquid Glass CSS properly compiled (verified via /_next/static/css): glass-card, glass-input, glass-btn-primary, glass-dock all present
- Theme tokens verified: Dark (#0a0d12 bg, #2aabee primary), Light (#eef2f7 bg, #1e95d6 primary)
- Build: 10 routes compile successfully, ~155KB First Load JS
- Both services running: backend http://localhost:4000, frontend http://localhost:3000
