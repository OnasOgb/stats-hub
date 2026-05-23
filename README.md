# StatsHub — Football Stat Tracker

A mobile-first football (soccer) stat tracker for weekly clubs. Create or join a hub, track match stats (goals, assists, clean sheets), chat with teammates, and compete on a realtime leaderboard.

Built with **Next.js 14**, **Supabase**, **Tailwind CSS**, and **Sentry**. Deployed on **Vercel**.

---

## Features

- **Multi-Tenant Hubs** — Create private hubs with unique invite codes; each hub has its own leaderboard, chat, and activity feed
- **Authentication** — Email magic link and Google OAuth powered by Supabase Auth
- **Stat Tracking** — Tap to increment/decrement goals, assists, and clean sheets with optimistic UI
- **Realtime Leaderboard** — Live-updating rankings with online presence indicators
- **Hub Chat** — Real-time messaging scoped to each hub with optimistic updates
- **Activity Feed** — Audit trail of all stat changes; admins can revert entries
- **Admin Roles** — Hub creators get admin privileges with stat revert controls
- **Profile Management** — Edit display name, upload and compress avatar photos, sign out
- **Hub Management** — Leave or delete hubs with confirmation dialogs
- **Error Monitoring** — Sentry integration across all components with error boundaries and session replay
- **Structured Logging** — Pino-based logging with module-specific loggers and pretty-print in development
- **PWA Support** — Web app manifest with icons for mobile home screen installation
- **Mobile-First Design** — Dark-mode UI built with shadcn/ui, responsive bottom navigation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18 + shadcn/ui (new-york style) + Tailwind CSS v3 |
| Icons | lucide-react |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Notifications | sonner |
| Error Monitoring | @sentry/nextjs (server, client, edge) |
| Logging | pino + pino-pretty |
| Image Processing | browser-image-compression |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Auth enabled (Email + Google OAuth)
- A [Sentry](https://sentry.io) project (optional, for error monitoring)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/stats-hub.git
cd stats-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Logging
LOG_LEVEL=debug

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_your-auth-token-here
```

### 4. Set up the database

Run the SQL in `supabase/setup.sql` against your Supabase project. This creates:

- The `profiles`, `hubs`, `hub_members`, `messages`, and `stat_logs` tables
- `handle_new_user` trigger — auto-creates a profile on signup
- `handle_new_hub_admin` trigger — auto-adds the hub creator as admin
- `increment_hub_stat` and `decrement_hub_stat` RPC functions with audit logging
- Row Level Security policies
- Realtime publication on `hub_members`, `messages`, and `stat_logs`

Then apply the migrations in order:

```
supabase/migration-001-multi-tenant.sql   — Multi-tenant hub setup
supabase/migration-002-avatars-storage.sql — Avatar storage bucket
supabase/migration-003-leave-delete-hub.sql — Cascade delete for leave/delete
```

### 5. Start the dev server

```bash
npm run dev
```

Dev output is piped through `pino-pretty` for readable, colorized logs.

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server with pretty-printed logs |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint with the Next.js config |

---

## Project Structure

```
stats-hub/
├── app/                                   # Next.js App Router pages
│   ├── layout.tsx                         # Root layout (metadata, fonts, Sentry trace)
│   ├── page.tsx                           # / — Hub listing for authenticated users
│   ├── globals.css                        # Theme (CSS custom properties)
│   ├── error.tsx                          # Error boundary with Sentry capture
│   ├── global-error.tsx                   # Global error boundary
│   ├── not-found.tsx                      # 404 page
│   ├── auth/
│   │   ├── page.tsx                       # /auth — Magic link + Google OAuth login
│   │   └── callback/
│   │       └── route.ts                   # OAuth callback handler
│   ├── profile/
│   │   └── page.tsx                       # /profile — Edit name, avatar, sign out
│   ├── hub/
│   │   ├── create/
│   │   │   └── page.tsx                   # /hub/create — Create a new hub
│   │   └── [hubId]/
│   │       ├── layout.tsx                 # Hub layout with HubProvider context
│   │       ├── leaderboard/
│   │       │   └── page.tsx               # /hub/:id/leaderboard — Tabs: Leaderboard, Activity, Chat
│   │       └── player/
│   │           └── [memberId]/
│   │               └── page.tsx           # /hub/:id/player/:memberId — Player stat pad
│   └── join/
│       ├── page.tsx                       # /join — Enter invite code
│       └── [code]/
│           └── page.tsx                   # /join/:code — Join hub confirmation
│
├── middleware.ts                           # Auth guard, request logging, redirect logic
├── instrumentation.ts                     # Sentry server/edge registration
├── instrumentation-client.ts              # Sentry client-side init with replay
├── sentry.server.config.ts                # Sentry server config
├── sentry.edge.config.ts                  # Sentry edge config
│
├── src/
│   ├── features/                          # Feature-based modules
│   │   ├── auth/
│   │   │   └── components/
│   │   │       └── AuthForm.tsx           # Magic link + Google OAuth form
│   │   ├── hub/
│   │   │   ├── components/
│   │   │   │   ├── ActivityFeed.tsx       # Realtime stat change log (admin revert)
│   │   │   │   ├── CreateHubForm.tsx      # Hub creation with invite code gen
│   │   │   │   ├── HubCard.tsx            # Hub card with leave/delete options
│   │   │   │   ├── HubChat.tsx            # Realtime chat with optimistic updates
│   │   │   │   ├── JoinHubFlow.tsx        # Join hub confirmation
│   │   │   │   ├── LeaderboardClient.tsx  # Realtime leaderboard with subscriptions + presence
│   │   │   │   ├── LeaderboardHeader.tsx  # Hub name, invite link, and admin controls
│   │   │   │   └── PlayerProfileClient.tsx # Stat +/- pad
│   │   │   ├── lib/
│   │   │   │   ├── queries.ts             # Supabase query functions for hub data
│   │   │   │   ├── types.ts               # Hub, HubMember, StatLog, Message, Profile types
│   │   │   │   ├── use-realtime-list.ts   # Generic realtime list subscription hook
│   │   │   │   └── use-stat-mutation.ts   # Centralized stat increment/decrement hook
│   │   │   └── providers/
│   │   │       └── HubContext.tsx         # Hub context (hub, currentMember, profile, admin checks)
│   │   └── profile/
│   │       └── components/
│   │           ├── ProfileForm.tsx         # Profile edit with avatar upload
│   │           └── PlayerAvatar.tsx        # Avatar with initials fallback
│   └── shared/                            # Shared utilities and UI components
│       ├── components/
│       │   ├── BottomNav.tsx              # Fixed bottom nav bar
│       │   └── ui/                        # shadcn/ui (Radix UI) components
│       │       ├── alert-dialog.tsx
│       │       ├── avatar.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── separator.tsx
│       │       ├── skeleton.tsx
│       │       ├── sonner.tsx
│       │       └── tabs.tsx
│       └── lib/
│           ├── cn.ts                      # cn() class merging utility
│           ├── logger.ts                  # Pino logger with module-specific children
│           ├── mutate.ts                  # Sentry-integrated async mutation helper
│           ├── supabase.ts                # Browser Supabase client (singleton)
│           ├── supabase-server.ts         # Server Supabase client factory
│           └── database.types.ts          # Auto-generated Supabase types
│
├── public/                                # Static assets & PWA icons
│   ├── manifest.json                      # PWA manifest
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-512-maskable.png
│
├── supabase/                              # Database setup & migrations
│   ├── setup.sql                          # Full schema, RLS, triggers, realtime
│   ├── migration-001-multi-tenant.sql     # Multi-tenant hub setup
│   ├── migration-002-avatars-storage.sql  # Avatar storage bucket
│   └── migration-003-leave-delete-hub.sql # Cascade delete for leave/delete
│
└── Configuration
    ├── next.config.mjs                    # Sentry wrapper, image remotes, redirects
    ├── tailwind.config.ts                 # Theme colors, fonts, animations
    ├── tsconfig.json                      # Path aliases (@/*, @/features/*, @/shared/*)
    ├── postcss.config.mjs                 # Tailwind CSS + autoprefixer
    ├── components.json                    # shadcn/ui config
    └── .eslintrc.json                     # ESLint rules
```

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/auth` | Public | Email magic link + Google OAuth login |
| `/auth/callback` | Public | OAuth redirect handler |
| `/` | Protected | Hub listing for the authenticated user |
| `/profile` | Protected | Edit display name, upload avatar, sign out |
| `/hub/create` | Protected | Create a new hub |
| `/join` | Protected | Enter an invite code to join a hub |
| `/join/[code]` | Protected | Join hub confirmation page |
| `/hub/[hubId]/leaderboard` | Protected | Leaderboard, activity feed, and chat (tabbed) |
| `/hub/[hubId]/player/[memberId]` | Protected | Player profile with stat +/- buttons |

---

## Database Schema

### `profiles`

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | from `auth.users` |
| `name` | `text` | — |
| `avatar_url` | `text` | — |
| `updated_at` | `timestamptz` | `now()` |

### `hubs`

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `gen_random_uuid()` |
| `name` | `text` | — |
| `invite_code` | `text` | unique |
| `created_by` | `uuid` | — |
| `created_at` | `timestamptz` | `now()` |

### `hub_members`

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `gen_random_uuid()` |
| `hub_id` | `uuid` | — |
| `user_id` | `uuid` | — |
| `role` | `text` | `'player'` |
| `goals` | `int` | `0` |
| `assists` | `int` | `0` |
| `clean_sheets` | `int` | `0` |
| `joined_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()` |

### `messages`

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `gen_random_uuid()` |
| `hub_id` | `uuid` | — |
| `sender_id` | `uuid` | — |
| `content` | `text` | 1–500 chars |
| `created_at` | `timestamptz` | `now()` |

### `stat_logs`

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `gen_random_uuid()` |
| `hub_id` | `uuid` | — |
| `member_id` | `uuid` | — |
| `actor_id` | `uuid` | — |
| `stat_type` | `text` | — |
| `delta` | `int` | `-1` or `1` |
| `created_at` | `timestamptz` | `now()` |

### Triggers

- **`handle_new_user`** — Automatically creates a profile row when a user signs up via Supabase Auth
- **`handle_new_hub_admin`** — Automatically adds the hub creator as an admin member

### RPC Functions

- **`increment_hub_stat(member_id, stat_column, hub_id)`** — Atomically increments a stat and creates an audit log entry
- **`decrement_hub_stat(member_id, stat_column, hub_id)`** — Atomically decrements a stat (floor of 0) and creates an audit log entry

Both validate that `stat_column` is one of `goals`, `assists`, or `clean_sheets`.

---

## Error Monitoring & Logging

### Sentry

Sentry is integrated at every level of the stack:

- **Error boundaries** — `error.tsx` and `global-error.tsx` capture unhandled errors
- **Component-level capture** — Business logic errors in AuthForm, CreateHubForm, HubCard, JoinHubFlow, PlayerProfileClient, ActivityFeed, HubChat, LeaderboardHeader, and ProfileForm
- **Tunnel route** — `/monitoring` route bypasses ad-blockers for reliable error reporting
- **Session replay** — 10% sample rate for error reproduction
- **Source maps** — Uploaded to Sentry for readable stack traces
- **Privacy** — `sendDefaultPii: false`; only user ID is attached to events

### Pino Logging

Structured logging with module-specific child loggers:

| Logger | Module | Usage |
|--------|--------|-------|
| `dbLogger` | `db` | Database query errors |
| `authLogger` | `auth` | Authentication events |
| `hubLogger` | `hub` | Hub operations |
| `pageLogger` | `page` | Page-level operations |

Log level is configurable via the `LOG_LEVEL` environment variable (defaults to `debug` in development, `info` in production).

---

## Architecture Decisions

- **Feature-based architecture** — Code is organized by feature domain (`src/features/`) rather than by technical role. Each feature has its own `components/`, `lib/`, and optional `providers/` directories. No barrel files; all imports use direct file paths.
- **Shared layer** — Cross-cutting concerns (Supabase clients, logger, UI primitives) live in `src/shared/`.
- **Multi-tenant hubs** — Each hub is an isolated group with its own leaderboard, chat, and activity feed. Players join via invite codes.
- **Supabase Auth** — Email magic link and Google OAuth. Middleware protects all routes except `/auth` and `/auth/callback`.
- **Realtime via Supabase** — The leaderboard subscribes to `postgres_changes` on `hub_members`, `messages`, and `stat_logs` for live updates across all connected clients.
- **Presence tracking** — Online status of hub members is tracked via Supabase Realtime presence channels.
- **Optimistic UI** — Stat mutations and chat messages update local state immediately, then sync with Supabase. On failure, the UI reverts.
- **Atomic RPC functions** — `increment_hub_stat`/`decrement_hub_stat` use `SECURITY DEFINER` to prevent race conditions and auto-create audit log entries.
- **Audit trail** — All stat changes are logged in `stat_logs`. Admins can revert individual entries from the activity feed.
- **Client-side image compression** — Avatar photos are compressed (max 1 MB, 512 px, WebP) before upload using `browser-image-compression`.
- **Layered error handling** — Sentry for production monitoring, Pino for structured server logs, error boundaries for graceful UI recovery.
- **Dark mode** — Dark-mode-only UI with CSS custom property theming.
- **PWA-ready** — Web app manifest and icons for home screen installation on mobile devices.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Default / base branch |
| `dev` | Active development |
| `staging` | Pre-production testing |
| `prod` | Production deployment |

---

## Extending the App

**Add a new route:** Create a folder in `app/` with a `page.tsx` file.

**Add a new feature module:** Create a folder in `src/features/` with `components/` and `lib/` (optional). Use direct file path imports — no barrel `index.ts` files.

**Add a shadcn/ui component:**

```bash
npx shadcn@latest add <component-name>
```

Components are placed in `src/shared/components/ui/` per the `components.json` config.

**Add a new stat column:**

1. Add the column to the `hub_members` table in Supabase
2. Update `supabase/setup.sql` and `src/shared/lib/database.types.ts`
3. Add the column name to the validation list in `increment_hub_stat`/`decrement_hub_stat`
4. Add the new stat controls in `PlayerProfileClient`

---

## License

This project is private.
