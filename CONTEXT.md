# CONTEXT.md — StatsHub

## 1. Project Identity

StatsHub is a **mobile-first football stat tracker for weekly clubs**. Players join isolated "hubs" via invite codes and track goals, assists, and clean sheets across sessions. Each hub has its own real-time leaderboard, chat, and activity feed.

- **Multi-tenant hub model** — one deployment, many independent groups
- **Private project**, active development, solo maintainer
- **Deployed on Vercel**

## 2. High-Level Architecture

Next.js 14 App Router with Supabase as the entire backend. Server components fetch data; client components render UI and subscribe to realtime changes. There are no traditional API routes — all data access goes through the Supabase client SDK.



## 3. Domain Glossary

| Term | Meaning |
|------|---------|
| **Hub** | Isolated multi-tenant group with its own leaderboard, chat, and activity feed |
| **Profile** | User identity — auto-created on signup via a database trigger |
| **HubMember** | Join table linking a profile to a hub; carries per-hub stats (`goals`, `assists`, `clean_sheets`) and `role` (`admin` / `player`) |
| **StatLog** | Audit trail entry recording every stat change as a delta (±1) |
| **Message** | Hub-scoped chat message |
| **Invite Code** | Unique lowercase alphanumeric slug (`^[a-z0-9-]+$`) used to join a hub |

## 4. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2 |
| UI library | React | 18.3 |
| Language | TypeScript | 5.8 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) | 2.49 |
| Styling | Tailwind CSS | 3.4 |
| Component library | shadcn/ui (new-york style, Radix UI) | — |
| Logging | Pino | 10.3 |
| Error monitoring | Sentry | 10.53 |
| Forms | react-hook-form + Zod | 7.71 / 3.24 |
| Charts | recharts | 2.15 |
| Toasts | sonner | 2.0 |
| Icons | lucide-react | 0.575 |
| Image compression | browser-image-compression | 2.0 |
| Deployment | Vercel | — |
| PWA | manifest.json | — |

## 5. Repository Structure

```
stats-hub/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (Sentry tunnel)
│   ├── auth/                     # Login page
│   │   └── callback/             # OAuth callback handler
│   ├── hub/
│   │   ├── create/               # Create hub flow
│   │   └── [hubId]/              # Hub detail pages
│   │       ├── leaderboard/
│   │       └── player/
│   ├── join/
│   │   └── [code]/               # Join hub via invite code
│   ├── profile/                  # User profile page
│   ├── error.tsx                 # Page-level error boundary
│   ├── global-error.tsx          # App-level error boundary
│   ├── globals.css               # CSS custom properties (dark mode only)
│   └── layout.tsx                # Root layout
├── src/
│   ├── features/                 # Feature-based modules
│   │   ├── activity/components/
│   │   ├── auth/components/
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── hub/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── providers/
│   │   ├── navigation/components/
│   │   └── profile/
│   │       ├── components/
│   │       └── lib/
│   └── shared/                   # Cross-cutting concerns
│       ├── components/ui/        # ⚠ shadcn-managed — regenerate, don't hand-edit
│       └── lib/
│           ├── database.types.ts # ⚠ Auto-generated — do not hand-edit
│           ├── logger.ts
│           ├── safe-async.ts
│           ├── supabase.ts       # Browser client
│           ├── supabase-server.ts
│           └── supabase-middleware.ts
├── supabase/
│   └── setup.sql                 # Full schema: tables, RLS, triggers, functions
├── public/
│   └── manifest.json             # PWA manifest
├── middleware.ts                  # Auth guard
├── instrumentation-client.ts     # Sentry client config
├── sentry.server.config.ts       # Sentry server config
├── sentry.edge.config.ts         # Sentry edge config
└── next.config.mjs
```

## 6. Setup & Local Development

**Prerequisites:** Node 18+, npm, a Supabase project.

```bash
# 1. Clone and install
git clone <repo-url> && cd stats-hub
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   LOG_LEVEL          (optional, defaults to "info")
#   NEXT_PUBLIC_SENTRY_DSN
#   SENTRY_AUTH_TOKEN

# 3. Set up Supabase schema
# Run supabase/setup.sql against your Supabase project (via SQL editor or CLI)

# 4. Start dev server
npm run dev
# → runs: next dev | pino-pretty --colorize
```

The dev script pipes Next.js stdout through `pino-pretty` for human-readable structured logs.

## 7. Coding Conventions

### Module structure
New features go in `src/features/{name}/` with sub-folders for `components/`, `lib/`, and `providers/` as needed.

### Path aliases (`tsconfig.json`)
```
@/*          → src/*
@/features/* → src/features/*
@/shared/*   → src/shared/*
```

### Error handling
Use `safeAsync()` for async operations in server code. It returns a tuple:
```typescript
type SafeResult<T> = [T, null] | [null, Error];

const [data, error] = await safeAsync(() => fetchSomething(), "context string");
```

### Logging
Use module-specific child loggers from `src/shared/lib/logger.ts`:
- `dbLogger` — database operations
- `authLogger` — authentication
- `hubLogger` — hub operations
- `pageLogger` — page-level logging
- `mwLogger` — middleware (defined in `middleware.ts`)

### Supabase clients
| Context | Function | File |
|---------|----------|------|
| Browser (client components) | `getSupabase()` | `src/shared/lib/supabase.ts` |
| Server components / route handlers | `createServerSupabaseClient()` | `src/shared/lib/supabase-server.ts` |
| Middleware | `createMiddlewareSupabaseClient()` | `src/shared/lib/supabase-middleware.ts` |

### Other conventions
- **Commit messages:** conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- **Dark mode only** — CSS custom properties defined in `globals.css`, no light mode variants

## 8. Architecture Decision Records (ADRs)

ADRs are placed **inline** — in the directory of the code they govern. Each follows the full 13-element format defined in `.agents/skills/grill-with-docs/ADR-FORMAT.md`.

| ADR | Title | Location |
|-----|-------|----------|
| ADR-0001 | Supabase as Sole Backend with No Custom API Routes | [`src/shared/lib/ADR-0001-supabase-sole-backend.md`](src/shared/lib/ADR-0001-supabase-sole-backend.md) |
| ADR-0002 | Atomic RPC Functions with SECURITY DEFINER for Stat Mutations | [`supabase/ADR-0002-atomic-rpc-stat-mutations.md`](supabase/ADR-0002-atomic-rpc-stat-mutations.md) |
| ADR-0003 | Feature-Based Module Organization | [`src/features/ADR-0003-feature-based-modules.md`](src/features/ADR-0003-feature-based-modules.md) |
| ADR-0004 | Row-Level Security as Sole Authorization Layer | [`supabase/ADR-0004-rls-sole-authorization.md`](supabase/ADR-0004-rls-sole-authorization.md) |
| ADR-0005 | Dark Mode Only with No Light Theme | [`app/ADR-0005-dark-mode-only.md`](app/ADR-0005-dark-mode-only.md) |
| ADR-0006 | Pino JSON Stdout with pino-pretty Pipe in Development | [`src/shared/lib/ADR-0006-pino-stdout-no-transports.md`](src/shared/lib/ADR-0006-pino-stdout-no-transports.md) |
| ADR-0007 | Optimistic UI with Supabase Realtime Reconciliation | [`src/features/hub/ADR-0007-optimistic-ui-realtime.md`](src/features/hub/ADR-0007-optimistic-ui-realtime.md) |
| ADR-0008 | Sentry Multi-Layer Monitoring with Tunnel Route | [`ADR-0008-sentry-multi-layer-monitoring.md`](ADR-0008-sentry-multi-layer-monitoring.md) |

To propose a new ADR, use sequential numbering (next: ADR-0009) and place the file in the directory of the code it governs.

## 9. Data Model & RLS

### Tables
- `profiles` — user identity (auto-created via `handle_new_user` trigger)
- `hubs` — hub metadata and settings
- `hub_members` — links profiles to hubs with stats and role
- `messages` — hub-scoped chat messages
- `stat_logs` — audit trail for stat changes

### Security
- **RLS enabled on all tables** — policies enforce membership-based access
- **Key triggers:**
  - `handle_new_user` — auto-creates a profile row on signup
  - `handle_new_hub_admin` — auto-adds the hub creator as admin
- **Realtime publications** on `hub_members`, `messages`, `stat_logs`

### Avatar storage
Supabase Storage bucket `avatars/`, path pattern: `{userId}/avatar-{timestamp}.webp`

## 10. Authentication

- **Providers:** Google OAuth + email magic link (OTP) via Supabase Auth
- **Middleware** guards all routes except `/auth` and `/auth/callback`
- Static assets (`/_next`, `/api`, `/icons`, `/manifest.json`, `/favicon.ico`, image files) are skipped
- Unauthenticated users are redirected to `/auth?next=<original-path>`

## 11. Error Handling & Observability

### Sentry
- Configured for **server, edge, and client** environments
- Trace sample rate: **10%**
- Session replay: 10% baseline, **100% on errors**
- `sendDefaultPii: false` — only UUID user IDs are sent, no emails or names
- Tunnel route at `/monitoring` bypasses ad-blockers

### Pino
- JSON structured logs to stdout
- Module-based child loggers (`db`, `auth`, `hub`, `page`, `middleware`)
- `LOG_LEVEL` env var controls verbosity

### Error boundaries
- `app/error.tsx` — page-level, captures exceptions via `Sentry.captureException()` with `extra` context
- `app/global-error.tsx` — app-level fallback, also reports to Sentry

## 12. Gotchas & Tribal Knowledge

- **`database.types.ts` is auto-generated** — regenerate with `supabase gen types typescript`, never hand-edit
- **`src/shared/components/ui/`** is managed by the shadcn CLI — regenerate, don't hand-edit
- **Pino transports don't work in Next.js** (webpack bundling issues) — that's why the dev script pipes through `pino-pretty`
- **`createServerSupabaseClient()` logs cookie errors at debug level** — these are expected in server components and are not bugs
- **Hub invite codes** use regex constraint `^[a-z0-9-]+$` — uppercase letters will fail
- **`increment_hub_stat` / `decrement_hub_stat`** validate membership via `auth.uid()` — calling without auth will throw
- **No test suite exists** — validation is manual QA

## 13. Security Posture

| Area | Implementation |
|------|---------------|
| **Authentication** | Supabase Auth (Google OAuth + email magic link) — no custom password handling |
| **Authorization** | RLS enabled on all five tables; policies enforce membership-based access |
| **SECURITY DEFINER functions** | `increment_hub_stat` / `decrement_hub_stat` validate `auth.uid()` membership before modifying data |
| **Secret management** | Environment variables only (`.env.local`, Vercel dashboard); `.env*.local` gitignored; no secrets in code |
| **PII handling** | Sentry configured with `sendDefaultPii: false` — only UUID user IDs are sent |
| **Input validation** | Zod schemas on all forms; database CHECK constraints on `invite_code`, `content` length, `stat_type` enum, `delta` range, and `role` enum |
| **Image uploads** | Client-side compression to 1 MB / 512 px / WebP before upload to Supabase Storage |
| **CSRF / XSS** | Handled by Next.js defaults (no `dangerouslySetInnerHTML`, server-side rendering) |
| **Dependency security** | No automated scanning configured (no Dependabot / Snyk); manual updates |

## 14. Deployment

- **Vercel** auto-deploys from `main` branch
- Environment variables configured in the Vercel dashboard
- Sentry source maps uploaded during build
- Sentry tunnel route at `/monitoring` bypasses ad-blockers
- Branches: `main`, `dev`, `staging`, `prod`

## 15. AI Agent Instructions

When working in this codebase:

1. **Read the ADR in the directory you're working in before making architectural changes** — ADRs document hard-to-reverse decisions with full rationale. Check section 8 for the registry.
2. **Follow feature-based module structure** — new features go in `src/features/{name}/`
3. **Reuse existing Supabase clients** — don't create new ones
4. **Use `safeAsync()`** for async error handling in server code
5. **Use module-specific loggers** from `src/shared/lib/logger.ts`
6. **Report errors to Sentry** with `extra` context in client components
7. **Don't hand-edit** `database.types.ts` or `src/shared/components/ui/*`
8. **Follow conventional commit format** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
9. **Dark mode only** — no light mode styles

## 16. Metadata

- **Last reviewed:** 2025-05-19
- **Owner:** Repository maintainer
- **Review cadence:** Update when architecture changes
