# StatsHub — Football Stat Tracker

A mobile-first football (soccer) stat tracker for weekly clubs. Create or join a hub, track match stats (goals, assists, clean sheets), chat with teammates, and compete on a realtime leaderboard.

Built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Deployed on **Vercel**.

---

## Features

- **Multi-Tenant Hubs** — Create private hubs with unique invite codes; each hub has its own leaderboard, chat, and activity feed
- **Authentication** — Email magic link and Google OAuth powered by Supabase Auth
- **Stat Tracking** — Tap to increment/decrement goals, assists, and clean sheets with optimistic UI
- **Realtime Leaderboard** — Live-updating rankings with online presence indicators
- **Hub Chat** — Real-time messaging scoped to each hub with optimistic updates
- **Activity Feed** — Audit trail of all stat changes; admins can revert entries
- **Admin Roles** — Hub creators get admin privileges with stat revert controls
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
| Image Processing | browser-image-compression |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Auth enabled (Email + Google OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/striders-stats-hub.git
cd striders-stats-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set up the database

Run the SQL in `supabase/setup.sql` against your Supabase project. This creates:

- The `profiles`, `hubs`, `hub_members`, `messages`, and `stat_logs` tables
- `increment_hub_stat` and `decrement_hub_stat` RPC functions with audit logging
- Row Level Security policies
- Realtime publication on `hub_members`, `messages`, and `stat_logs`

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint with the Next.js config |

---

## Project Structure

```
striders-stats-hub/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout (metadata, fonts, dark mode)
│   ├── page.tsx                      # / — Hub listing for authenticated users
│   ├── globals.css                   # Theme (CSS custom properties)
│   ├── error.tsx                     # Global error boundary
│   ├── not-found.tsx                 # 404 page
│   ├── auth/
│   │   ├── page.tsx                  # /auth — Magic link + Google OAuth login
│   │   └── callback/
│   │       └── route.ts             # OAuth callback handler
│   ├── hub/
│   │   ├── create/
│   │   │   └── page.tsx             # /hub/create — Create a new hub
│   │   └── [hubId]/
│   │       ├── layout.tsx           # Hub layout with HubProvider context
│   │       ├── leaderboard/
│   │       │   └── page.tsx         # /hub/:id/leaderboard — Tabs: Leaderboard, Activity, Chat
│   │       └── player/
│   │           └── [memberId]/
│   │               └── page.tsx     # /hub/:id/player/:memberId — Player stat pad
│   └── join/
│       ├── page.tsx                 # /join — Enter invite code
│       └── [code]/
│           └── page.tsx             # /join/:code — Join hub confirmation
│
├── middleware.ts                     # Auth guard — redirects unauthenticated users to /auth
│
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx            # Fixed bottom navigation bar
│   │   ├── LeaderboardTabs.tsx      # Tab container (Leaderboard / Activity / Chat)
│   │   ├── LeaderboardClient.tsx    # Realtime subscriptions + presence tracking
│   │   ├── LeaderboardTable.tsx     # Sortable leaderboard with online indicators
│   │   ├── PlayerProfileClient.tsx  # Stat increment/decrement UI
│   │   ├── StatButton.tsx           # Animated +/- stat control
│   │   ├── PlayerAvatar.tsx         # Avatar with image or initials fallback
│   │   ├── hub/
│   │   │   ├── CreateHubForm.tsx    # Hub creation form with invite code generation
│   │   │   ├── HubCard.tsx          # Hub card for listing page
│   │   │   └── JoinHubFlow.tsx      # Join hub confirmation flow
│   │   ├── chat/
│   │   │   ├── HubChat.tsx          # Real-time chat with optimistic updates
│   │   │   ├── ChatMessage.tsx      # Individual message bubble
│   │   │   └── ChatInput.tsx        # Message input field
│   │   ├── activity/
│   │   │   ├── ActivityFeed.tsx     # Stat change audit log (admin can revert)
│   │   │   └── ActivityLogItem.tsx  # Individual activity entry
│   │   ├── providers/
│   │   │   └── HubContext.tsx       # Hub context provider (hub, currentMember, profile)
│   │   └── ui/                      # shadcn/ui component library
│   ├── lib/
│   │   ├── supabase.ts              # Browser Supabase client (lazy-initialized)
│   │   ├── supabase-server.ts       # Server Supabase client factory
│   │   ├── supabase-middleware.ts   # Middleware Supabase client for auth checks
│   │   ├── database.types.ts        # Auto-generated Supabase types
│   │   ├── types.ts                 # App types (Profile, Hub, HubMember, Message, StatLog)
│   │   ├── validations.ts           # Zod schemas + slugify utility
│   │   └── utils.ts                 # cn() class merging utility
│   └── hooks/
│       ├── use-auth.ts              # Client-side auth state hook
│       └── use-mobile.tsx           # Mobile viewport detection hook
│
├── supabase/
│   ├── setup.sql                    # Full database schema & RLS setup
│   └── migration-001-multi-tenant.sql # Multi-tenant migration
│
└── Configuration
    ├── next.config.mjs              # Image remote patterns, route redirects
    ├── tailwind.config.ts           # Theme colors, fonts, animations
    ├── tsconfig.json                # Path aliases (@/* → src/*)
    ├── components.json              # shadcn/ui config
    └── .eslintrc.json               # ESLint rules
```

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/auth` | Public | Email magic link + Google OAuth login |
| `/auth/callback` | Public | OAuth redirect handler |
| `/` | Protected | Hub listing for the authenticated user |
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

### RPC Functions

- **`increment_hub_stat(member_id, stat_column, hub_id)`** — Atomically increments a stat and creates an audit log entry
- **`decrement_hub_stat(member_id, stat_column, hub_id)`** — Atomically decrements a stat (floor of 0) and creates an audit log entry

Both validate that `stat_column` is one of `goals`, `assists`, or `clean_sheets`.

---

## Architecture Decisions

- **Multi-tenant hubs** — Each hub is an isolated group with its own leaderboard, chat, and activity feed. Players join via invite codes.
- **Supabase Auth** — Email magic link and Google OAuth. Middleware protects all routes except `/auth`.
- **Realtime via Supabase** — The leaderboard subscribes to `postgres_changes` on `hub_members`, `messages`, and `stat_logs` for live updates across all connected clients.
- **Presence tracking** — Online status of hub members is tracked via Supabase Realtime presence channels.
- **Optimistic UI** — Stat mutations and chat messages update local state immediately, then sync with Supabase. On failure, the UI reverts.
- **Atomic RPC functions** — `increment_hub_stat`/`decrement_hub_stat` use `SECURITY DEFINER` to prevent race conditions and auto-create audit log entries.
- **Audit trail** — All stat changes are logged in `stat_logs`. Admins can revert individual entries from the activity feed.
- **Client-side image compression** — Photos are compressed before upload using `browser-image-compression`.
- **Dark mode** — Dark-mode-only UI with CSS custom property theming.

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

**Add a shadcn/ui component:**

```bash
npx shadcn@latest add <component-name>
```

Components are placed in `src/components/ui/` per the `components.json` config.

**Add a new stat column:**

1. Add the column to the `hub_members` table in Supabase
2. Update `supabase/setup.sql` and `src/lib/database.types.ts`
3. Add the column name to the validation list in `increment_hub_stat`/`decrement_hub_stat`
4. Add a new `StatButton` in `PlayerProfileClient`

---

## License

This project is private.
