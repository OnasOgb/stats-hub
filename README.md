# Strider — Football Stat Tracker

A mobile-first football (soccer) stat tracker for weekly clubs. Players join the club, self-report their match stats (goals, assists, clean sheets) on an honor system, and compete on a realtime leaderboard.

Built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Deployed on **Vercel**.

---

## Features

- **Player Onboarding** — Join with a name and optional profile photo (auto-compressed client-side)
- **Stat Tracking** — Tap to increment/decrement goals, assists, and clean sheets with optimistic UI
- **Realtime Leaderboard** — Live-updating rankings powered by Supabase Realtime (`postgres_changes`)
- **Mobile-First Design** — Dark-mode-only UI built with shadcn/ui and OKLCH colors
- **No Auth Required** — Honor-system stat reporting; player identity stored in `localStorage` + cookie

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18 + shadcn/ui (new-york style) + Tailwind CSS v3 |
| Icons | lucide-react |
| Backend | Supabase (PostgreSQL + Storage + Realtime) |
| Forms | react-hook-form + zod |
| Image Processing | browser-image-compression |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

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

- The `players` table
- `increment_stat` and `decrement_stat` RPC functions
- Row Level Security policies (public read/write)
- A `player-photos` storage bucket
- Realtime publication on the `players` table

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
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (metadata, Inter font, dark mode)
│   ├── page.tsx                  # / — Join the Club form
│   ├── globals.css               # Theme (OKLCH CSS custom properties)
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # 404 page
│   ├── leaderboard/
│   │   └── page.tsx              # /leaderboard — Realtime leaderboard
│   └── player/
│       └── [id]/
│           └── page.tsx          # /player/:id — Player profile & stat pad
│
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx         # Fixed bottom navigation bar
│   │   ├── LeaderboardClient.tsx # Realtime subscription wrapper
│   │   ├── LeaderboardTable.tsx  # Ranked player table with medals
│   │   ├── PlayerProfileClient.tsx # Stat increment/decrement UI
│   │   ├── StatButton.tsx        # Animated +/- stat control
│   │   ├── PlayerAvatar.tsx      # Avatar with image or initials fallback
│   │   └── ui/                   # shadcn/ui component library
│   ├── lib/
│   │   ├── supabase.ts           # Browser Supabase client (lazy-initialized)
│   │   ├── supabase-server.ts    # Server Supabase client factory
│   │   ├── database.types.ts     # Auto-generated Supabase types
│   │   ├── types.ts              # Player type aliases
│   │   ├── validations.ts        # Zod form schemas
│   │   └── utils.ts              # cn() class merging utility
│   └── hooks/
│       └── use-mobile.tsx        # Mobile device detection hook
│
├── supabase/
│   └── setup.sql                 # Full database schema & RLS setup
│
└── Configuration
    ├── next.config.mjs           # Image remote patterns for Supabase Storage
    ├── tailwind.config.ts        # Theme colors, fonts, animations
    ├── tsconfig.json             # Path aliases (@/* → src/*)
    ├── components.json           # shadcn/ui config
    └── .eslintrc.json            # ESLint rules
```

---

## Routes

| Path | Type | Description |
|------|------|-------------|
| `/` | Client Component | Player onboarding — name input + photo upload |
| `/leaderboard` | Server Component | Live leaderboard sorted by goals |
| `/player/[id]` | Server Component | Player profile with stat increment/decrement buttons |

---

## Database Schema

### `players` table

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `gen_random_uuid()` |
| `name` | `text` | — |
| `photo_url` | `text` | `''` |
| `goals` | `int` | `0` |
| `assists` | `int` | `0` |
| `clean_sheets` | `int` | `0` |
| `updated_at` | `timestamptz` | `now()` |

### RPC Functions

- **`increment_stat(player_id, stat_column)`** — Atomically increments a stat column
- **`decrement_stat(player_id, stat_column)`** — Atomically decrements a stat column (floor of 0)

Both validate that `stat_column` is one of `goals`, `assists`, or `clean_sheets`.

---

## Architecture Decisions

- **No authentication** — Stats are reported on an honor system. Player identity is persisted client-side via `localStorage` and a `strider-player-id` cookie.
- **Realtime via Supabase** — The leaderboard subscribes to `postgres_changes` on the `players` table, so all connected clients see stat updates instantly.
- **Optimistic UI** — Stat mutations update local state immediately, then call the Supabase RPC. On failure, the UI reverts.
- **Atomic RPC functions** — `increment_stat`/`decrement_stat` use dynamic SQL with `SECURITY DEFINER` to prevent race conditions.
- **Client-side image compression** — Photos are compressed to 0.5 MB / 400x400px before upload using `browser-image-compression`.
- **Dark mode only** — The root `<html>` element has `class="dark"` hardcoded, with an OKLCH green primary color.

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

1. Add the column to the `players` table in Supabase
2. Update `supabase/setup.sql` and `src/lib/database.types.ts`
3. Add the column name to the validation list in `increment_stat`/`decrement_stat`
4. Add a new `StatButton` in `PlayerProfileClient`

---

## License

This project is private.
