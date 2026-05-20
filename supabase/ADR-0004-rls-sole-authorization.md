# Row-Level Security as Sole Authorization Layer

**ID:** ADR-0004
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub uses Supabase as its entire backend (ADR-0001), which means the Supabase anon key is public — embedded in client-side JavaScript. Without an API layer to enforce permissions, the only authorization boundary is the database itself. PostgreSQL's Row-Level Security (RLS) provides per-row access control evaluated on every query, using `auth.uid()` from the Supabase JWT.

The app has a multi-tenant hub model where data isolation between hubs is critical: players in Hub A must not see messages, stats, or member lists from Hub B.

## Decision

We enable RLS on all five tables (`profiles`, `hubs`, `hub_members`, `messages`, `stat_logs`) and enforce all authorization through RLS policies. There is no application-layer permission checking — no middleware guards, no server-side "can this user do X?" checks, no API route authorization.

Key policy patterns (from `supabase/migration-001-multi-tenant.sql`):

- **Profiles / Hubs:** Readable by all authenticated users (`USING (true)`)
- **Hub members:** Readable only by co-members of the same hub (subquery on `hub_members` checking `auth.uid()`)
- **Messages / Stat logs:** Readable and writable only by members of the message's/log's hub
- **Stat log deletion:** Restricted to hub admins (`role = 'admin'`)
- **Profile updates:** Only the owning user (`id = auth.uid()`)
- **Hub creation:** Any authenticated user (`auth.uid() IS NOT NULL`)
- **Joining hubs:** Authenticated user can only insert their own membership (`user_id = auth.uid()`)

## Consequences

### Positive
- Authorization is enforced at the lowest possible layer — no way to bypass it from client code, even with a modified SDK
- Multi-tenant data isolation is guaranteed by the database, not by application logic that could be forgotten in a new feature
- Every new table automatically requires explicit policy decisions before data is accessible (RLS defaults to deny-all)
- Single source of truth for "who can access what" — reviewable in SQL, not scattered across middleware and components

### Negative
- **Policy complexity grows with features** — each new table or access pattern requires careful SQL policy authoring
- **Debugging is opaque** — a query returning empty results could be a data issue or a policy issue; no clear error message distinguishes them
- **Testing is manual** — no automated test suite validates RLS policies; mistakes are caught by QA or in production
- **`SECURITY DEFINER` functions bypass RLS** — the `increment_hub_stat` / `decrement_hub_stat` RPCs (ADR-0002) run with elevated privileges and must validate `auth.uid()` internally
- **Policy performance** — subqueries in RLS policies (e.g., "is user a member of this hub?") add overhead to every query on those tables

## Alternatives Considered

### Application-Layer Authorization (Middleware / Server Actions)
- **Pros:** Familiar pattern; easier to debug; can return meaningful error messages ("you don't have access to this hub")
- **Cons:** Every new endpoint or query path must remember to check permissions; a single missed check leaks data; duplicates logic across server components and API routes
- **Rejected because:** With no custom API layer (ADR-0001), there's no consistent place to enforce application-layer checks; RLS provides a security floor that can't be accidentally bypassed

### Hybrid (RLS + Application Checks)
- **Pros:** Defense in depth; application layer provides user-friendly error messages while RLS prevents leaks
- **Cons:** Dual maintenance of permission logic; risk of the two layers getting out of sync; false sense of security if one layer is assumed to cover the other
- **Rejected because:** The added maintenance burden is not justified for a solo-maintainer project with a simple permission model (member/admin per hub)

## Assumptions

- The permission model remains simple: authenticated/unauthenticated, hub member/non-member, admin/player. If fine-grained roles emerge (e.g., "coach", "viewer"), RLS policies may become unwieldy.
- Supabase correctly maps the JWT `sub` claim to `auth.uid()` on every request.
- RLS policy subqueries (checking hub membership) perform acceptably at the current scale (< 100 members per hub, < 1000 hubs total).
- `SECURITY DEFINER` functions are audited whenever they are modified (see ADR-0002).

## Scope

- **Applies to:** All five tables (`profiles`, `hubs`, `hub_members`, `messages`, `stat_logs`) and any future tables added to the schema
- **Does not apply to:** `SECURITY DEFINER` RPC functions, which bypass RLS by design and perform their own `auth.uid()` validation (ADR-0002)
- **Also governs:** Multi-tenant hub isolation — a hub member can only see co-members, messages, and stat logs within their own hubs

## Security Implications

- **RLS defaults to deny-all** — a new table with RLS enabled but no policies is inaccessible, which is the safe default
- **Policy mistakes are silent** — a permissive policy won't throw an error; it will silently expose data. Review all policies in `supabase/setup.sql` and `supabase/migration-001-multi-tenant.sql` carefully.
- **`SECURITY DEFINER` is the primary escape hatch** — these functions run as the function owner, not the calling user. They must validate `auth.uid()` internally or they create privilege escalation vulnerabilities.
- **Realtime subscriptions respect RLS** — Supabase Realtime filters rows through the same policies, so a user cannot subscribe to another hub's messages

## Cost Implications

- **Upfront:** Learning PostgreSQL RLS syntax and Supabase's `auth.uid()` integration. Writing and testing policies for all five tables.
- **Ongoing:** Every new table or access pattern requires policy authoring. No automated testing means manual verification. Debugging "empty result" issues requires checking policies. Performance overhead of subquery-based policies is negligible at current scale but may need indexing or materialized views if hub sizes grow significantly.

## Success Metrics / Validation Criteria

- No data leaks between hubs — a member of Hub A cannot read Hub B's messages, stats, or member list via direct Supabase SDK calls
- All five tables have RLS enabled with explicit policies
- `SECURITY DEFINER` functions validate `auth.uid()` before modifying data
- Reassess if: the permission model grows beyond member/admin (fine-grained roles), RLS policy debugging becomes a significant time sink, or automated policy testing becomes feasible

---
**Related ADRs:** [ADR-0001](../src/shared/lib/ADR-0001-supabase-sole-backend.md), [ADR-0002](ADR-0002-atomic-rpc-stat-mutations.md)
