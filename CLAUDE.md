# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StatsHub is a mobile-first football stat tracker built with Next.js 14 (App Router) and Supabase. Players join isolated hubs via invite codes and track goals, assists, and clean sheets. Each hub has its own real-time leaderboard, chat, and activity feed. Dark mode only.

## Commands

```bash
npm run dev      # Dev server with Pino pretty-printing
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint (next/core-web-vitals)
```

No test framework is configured.

## Architecture

### Split layout: `app/` routes + `src/` features

Route pages live in `app/` (Next.js requirement). All domain logic lives in `src/` using feature-based modules:

```
app/                         # Thin route pages: load data, render feature components
  hub/[hubId]/               # Hub layout provides HubContext to all child routes
src/
  features/
    auth/components/         # AuthForm (Google OAuth + email magic link)
    hub/
      components/            # LeaderboardClient, ActivityFeed, HubChat, PlayerProfileClient, etc.
      lib/                   # types, queries, useRealtimeList, useStatMutation
      providers/             # HubContext (hub, member, profile, permission flags)
    profile/
      components/            # ProfileForm, PlayerAvatar
  shared/
    components/ui/           # shadcn/ui primitives (Radix + Tailwind)
    components/BottomNav.tsx  # Mobile navigation
    lib/                     # Supabase clients, logger, mutate wrapper, utils
```

### No barrel files

All imports use direct file paths. No `index.ts` re-exports anywhere.

```ts
import { HubChat } from "@/features/hub/components/HubChat";
import { getSupabase } from "@/shared/lib/supabase";
```

Path aliases: `@/*` → `src/*`, `@/features/*` → `src/features/*`, `@/shared/*` → `src/shared/*`.

### Supabase is the entire backend (no API routes, no ORM)

- **Auth:** Supabase Auth (Google OAuth + magic link). Two client factories: browser (`supabase.ts`), server (`supabase-server.ts`). Middleware uses `createServerClient` from `@supabase/ssr` directly.
- **Database:** PostgreSQL via Supabase SDK directly. Schema in `supabase/setup.sql` and migration files. Five tables: `profiles`, `hubs`, `hub_members`, `messages`, `stat_logs`.
- **Authorization:** RLS policies on all tables. No application-layer permission checks. The database is the sole authorization boundary.
- **Realtime:** Supabase Realtime `postgres_changes` on `hub_members`, `messages`, `stat_logs`.
- **Stat mutations:** Atomic via `SECURITY DEFINER` RPC functions (`increment_hub_stat`, `decrement_hub_stat`) that update the stat and write an audit log in a single transaction.
- **Types:** Auto-generated `database.types.ts` provides the `Database` generic for all Supabase clients.

### Data flow patterns

- **Server components** fetch data via query functions in `src/features/hub/lib/queries.ts` using `createServerSupabaseClient()`. Pages use `export const revalidate = 0` (no caching).
- **HubContext** (`useHub()`) provides hub, member, profile, and permission flags (`isAdmin`, `canMutateStats`, `canDeleteHub`) to client components.
- **`useRealtimeList`** — generic hook for real-time lists with optimistic inserts, realtime confirmation, revert on error, and UPDATE/DELETE handling. Used by chat, activity feed, and leaderboard.
- **`useStatMutation`** — hook providing `changeStat()` and `revertStatLog()` with `onOptimistic`/`onRevert`/`onSuccess` callback pattern.
- **`mutate()`** wrapper — wraps Supabase mutations with Sentry error capture and optional toast notification.

### Observability

- **Logging:** Pino with module-specific child loggers (`dbLogger`, `authLogger`, `hubLogger`, `pageLogger`, `mwLogger`). Output goes to stdout; `pino-pretty` formats it in dev.
- **Error tracking:** Sentry on client, server, and edge. Error boundaries at page (`error.tsx`) and app (`global-error.tsx`) levels.

## Domain Language (from CONTEXT.md)

Use these terms consistently in code, comments, and commits:

| Use | Avoid |
|-----|-------|
| Hub | Group, team, club, room |
| Profile | User, account |
| Hub Member | Membership, participant |
| Stat | Score, point, metric |
| Stat Log | Activity log entry, event |
| Admin / Player | Owner, moderator, regular member |
| Leaderboard | Standings, rankings, scoreboard |
| Activity Feed | Event log, timeline |

## Key Conventions

- **Validation:** Zod schemas co-located inline in the components that use them (e.g., `CreateHubForm`, `ProfileForm`), used with `react-hook-form` + `@hookform/resolvers`.
- **UI components:** shadcn/ui (Radix UI + Tailwind). Icons from `lucide-react`.
- **CSS:** OKLCH color tokens in `globals.css`, dark mode only (class `dark` hardcoded on `<html>`). No light theme.
- **Middleware:** Auth guard redirects unauthenticated users to `/auth`. Public paths: `/auth`, `/auth/callback`.

## ADR Registry

Architectural Decision Records live in `docs/adr/`:

| ADR | Topic |
|-----|-------|
| 0001 | Supabase as sole backend |
| 0002 | Atomic RPC stat mutations |
| 0003 | Feature-based module organization |
| 0004 | RLS as sole authorization |
| 0005 | Dark mode only |
| 0006 | Pino stdout logging |
| 0007 | Optimistic UI + realtime |
| 0008 | Sentry multi-layer monitoring |

ADR format guide: `.agents/skills/grill-with-docs/ADR-FORMAT.md`.

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
LOG_LEVEL                     # Pino log level (debug, info, warn, error)
NEXT_PUBLIC_SENTRY_DSN        # Sentry DSN (omit to disable)
SENTRY_AUTH_TOKEN             # Sentry auth token for source maps
```

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on `OnasOgb/stats-hub` (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` at the repo root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.
