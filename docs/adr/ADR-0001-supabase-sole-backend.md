# Supabase as Sole Backend with No Custom API Routes

**ID:** ADR-0001
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub is a mobile-first football stat tracker built by a solo maintainer. The app needs authentication, a relational database, file storage, and real-time subscriptions. A traditional approach would layer a custom API (Express, tRPC, or Next.js API routes) between the frontend and the database, adding boilerplate, deployment surface, and maintenance burden.

Supabase provides PostgreSQL, Auth (Google OAuth + magic link), Storage, and Realtime as a single managed service. The `@supabase/ssr` SDK offers typed client factories for browser, server-component, and middleware contexts — eliminating the need for hand-rolled API routes.

## Decision

We use Supabase as the entire backend. All data access flows through the Supabase client SDK — there are no custom Next.js API routes for business logic. Two client factories plus an inline middleware client cover every runtime context:

| Context | Factory | File |
|---------|---------|------|
| Browser (client components) | `getSupabase()` | `src/shared/lib/supabase.ts` |
| Server components / route handlers | `createServerSupabaseClient()` | `src/shared/lib/supabase-server.ts` |
| Middleware | `createServerClient()` (from `@supabase/ssr`) | `middleware.ts` (inline) |

Authentication is delegated entirely to Supabase Auth (Google OAuth + email magic link OTP). User profiles are auto-created via a `handle_new_user` database trigger — no signup API route exists.

The only API route in the project is `/api/monitoring` (Sentry tunnel), which is infrastructure, not business logic.

## Consequences

### Positive
- Zero API boilerplate — no controllers, serializers, or route handlers to maintain
- Auth, storage, realtime, and database are a single vendor with a unified SDK
- Row-level security (RLS) enforces authorization at the database layer, removing an entire class of "forgot to check permissions" bugs
- Typed client via `Database` generic keeps queries type-safe across all contexts
- Solo maintainer can ship features faster with fewer moving parts

### Negative
- **Vendor lock-in** — migrating off Supabase means rewriting auth, storage, realtime, and every query
- **No custom server logic layer** — complex business rules must live in SQL functions (`SECURITY DEFINER` RPCs) or client-side code
- **Limited query composition** — Supabase's PostgREST query builder is less flexible than raw SQL or an ORM for complex joins
- **Anon key is public** — all security depends on RLS policies being correct; a policy mistake exposes data

## Alternatives Considered

### Next.js API Routes + Prisma/Drizzle ORM
- **Pros:** Full control over business logic; familiar Node.js middleware patterns; easy to add validation layers
- **Cons:** Doubles the surface area (API routes + database); requires manual auth middleware; no built-in realtime
- **Rejected because:** The added complexity is not justified for a solo-maintained app with straightforward CRUD + real-time needs

### Firebase
- **Pros:** Mature realtime database; generous free tier; Google ecosystem integration
- **Cons:** NoSQL data model is a poor fit for relational stat tracking and leaderboards; Firestore query limitations; vendor lock-in is equally deep
- **Rejected because:** Relational queries (leaderboard ranking, stat aggregation) are core to the domain and need SQL

### Self-hosted PostgreSQL + custom API
- **Pros:** No vendor lock-in; full control over infrastructure
- **Cons:** Requires managing auth, realtime, storage, and deployment infrastructure manually; operational overhead is prohibitive for a solo project
- **Rejected because:** The operational burden outweighs the flexibility gains for a single-maintainer project

## Assumptions

- Supabase's free/pro tier is sufficient for the project's scale (< 10k monthly active users)
- PostgREST's query builder handles all required query patterns (no need for raw SQL beyond RPC functions)
- Supabase Auth providers (Google OAuth, magic link) cover the target user base
- The `@supabase/ssr` SDK remains stable and maintained for Next.js App Router

## Scope

- **Applies to:** All data access, authentication, file storage, and realtime subscriptions throughout the application
- **Does not apply to:** The Sentry tunnel route (`/api/monitoring`), which is infrastructure plumbing, not business logic
- **Also governs:** Multi-tenant hub isolation (enforced via RLS, not application-layer checks) and auth provider choice (Google OAuth + magic link are Supabase Auth features, not custom implementations)

## Security Implications

- The Supabase anon key is embedded in client-side JavaScript — it is public by design. **All authorization depends on RLS policies** (see ADR-0004).
- `SECURITY DEFINER` RPC functions bypass RLS and must validate `auth.uid()` internally (see ADR-0002).
- Cookie-based session management is handled by `@supabase/ssr` across both client factories and the inline middleware client. The middleware client refreshes sessions on every request.
- `sendDefaultPii: false` in Sentry config ensures no email addresses leak through error reports.

## Cost Implications

- **Upfront:** Learning Supabase SDK patterns, RLS policy design, and RPC function authoring. Minimal — well-documented.
- **Ongoing:** Supabase billing based on database size, auth users, storage, and realtime connections. Currently within free tier. Pro tier ($25/mo) if the project scales beyond free limits. Migration cost is high if Supabase is abandoned — auth, storage, realtime, and all queries need replacement.

## Success Metrics / Validation Criteria

- Zero custom API routes for business logic (currently met — only `/api/monitoring` exists)
- All CRUD operations work through the Supabase client SDK with type safety
- Auth flows (Google OAuth, magic link) work without custom backend code
- Reassess if: Supabase free tier limits are hit, query patterns require raw SQL beyond RPC functions, or a second maintainer finds the RLS-only approach too opaque

---
**Related ADRs:** [ADR-0002](ADR-0002-atomic-rpc-stat-mutations.md), [ADR-0004](ADR-0004-rls-sole-authorization.md), [ADR-0008](ADR-0008-sentry-multi-layer-monitoring.md)
