# Atomic RPC Functions with SECURITY DEFINER for Stat Mutations

**ID:** ADR-0002
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub's core interaction is incrementing and decrementing player stats (goals, assists, clean sheets). Each stat change must atomically update the `hub_members` row **and** insert a `stat_logs` audit trail entry. If these are two separate client-side queries, a race condition can cause the stat counter and audit log to diverge — especially when multiple players tap +/- simultaneously on a shared leaderboard.

Additionally, RLS policies (ADR-0004) restrict `hub_members` updates to co-members, but the stat mutation also needs to insert into `stat_logs` on behalf of the actor. Doing both in a single transaction from the client is not possible through PostgREST's REST API — each `.from().update()` and `.from().insert()` is a separate HTTP request.

## Decision

We use two PostgreSQL RPC functions — `increment_hub_stat` and `decrement_hub_stat` — declared as `SECURITY DEFINER` and called via `supabase.rpc()`. Each function:

1. **Validates the stat column** — rejects values not in `('goals', 'assists', 'clean_sheets')`
2. **Verifies hub membership** — checks that the target `p_member_id` exists in the given `p_hub_id`
3. **Atomically updates the stat** — uses `format()` + `EXECUTE` for dynamic column names
4. **Inserts an audit log** — records the actor (`auth.uid()`), stat type, and delta (±1) in `stat_logs`
5. **Floors at zero** — `decrement_hub_stat` uses `GREATEST(%I - 1, 0)` to prevent negative stats

Both functions are defined in `supabase/migration-001-multi-tenant.sql` (lines 87-141) and `supabase/setup.sql` (lines 28-40).

## Consequences

### Positive
- **Atomicity** — stat update and audit log are a single transaction; no partial writes possible
- **Race-condition-free** — PostgreSQL serializes concurrent updates to the same row
- **Audit trail integrity** — every stat change is logged with actor, timestamp, and delta; the log cannot be out of sync with the counter
- **Single RPC call from client** — `supabase.rpc('increment_hub_stat', { ... })` replaces two separate queries
- **Input validation in SQL** — invalid stat columns are rejected before any data modification

### Negative
- **`SECURITY DEFINER` bypasses RLS** — these functions run as the function owner (superuser), not the calling user. A bug in the function's internal validation would escalate privileges.
- **Dynamic SQL via `format()` + `EXECUTE`** — while `format('%I', ...)` safely quotes identifiers, this pattern is harder to audit than static SQL
- **Schema coupling** — the functions hardcode the stat column names (`goals`, `assists`, `clean_sheets`). Adding a new stat type requires modifying both functions.
- **No return value** — functions return `void`; the client must rely on error absence to confirm success, then refresh or wait for realtime updates

## Alternatives Considered

### Client-Side Multi-Query with RLS
- **Pros:** No `SECURITY DEFINER` needed; RLS handles authorization naturally; simpler SQL
- **Cons:** Two separate HTTP requests (update + insert) create a race window; no transactional guarantee; audit log can be missing if the second request fails
- **Rejected because:** Data integrity for the audit trail is non-negotiable — partial writes would make stat history unreliable

### Database Trigger on `hub_members` UPDATE
- **Pros:** Automatic audit logging on any stat change; no explicit log insert needed
- **Cons:** Trigger fires on any `hub_members` update (role changes, joins), not just stat changes; would need complex conditional logic to determine which column changed and by how much; doesn't solve the authorization problem
- **Rejected because:** Triggers are harder to reason about and test; the explicit RPC approach is more visible and auditable

### Supabase Edge Functions (Deno)
- **Pros:** Full server-side logic in TypeScript; can compose multiple queries transactionally via the service role key
- **Cons:** Adds a new runtime (Deno) to the stack; cold start latency; another deployment artifact to manage; overkill for a two-query transaction
- **Rejected because:** A SQL function is the simplest solution for an atomic multi-statement operation within a single database

## Assumptions

- The stat types are fixed at `goals`, `assists`, `clean_sheets`. If new stat types are added, both RPC functions and their validation must be updated.
- `auth.uid()` is always available when these functions are called (enforced by middleware auth guard).
- The `format('%I', p_stat_column)` pattern safely prevents SQL injection for identifier names.
- Concurrent stat updates are infrequent enough that PostgreSQL's default row-level locking handles contention without deadlocks.

## Scope

- **Applies to:** All stat increment/decrement operations in the application. Client-side RPC calls are centralized in the `useStatMutation` hook (`src/features/hub/lib/use-stat-mutation.ts`), which is consumed by `PlayerProfileClient.tsx` (stat +/−) and `ActivityFeed.tsx` (stat log revert)
- **Does not apply to:** Other `SECURITY DEFINER` functions (`handle_new_user`, `handle_new_hub_admin`) which are trigger-based and don't involve stat mutations
- **Does not apply to:** Read queries on `hub_members` or `stat_logs`, which go through normal RLS-protected PostgREST queries

## Security Implications

- **`SECURITY DEFINER` is a privilege escalation mechanism** — these functions execute with the owner's permissions, bypassing RLS. The internal `auth.uid()` check and membership verification are the only authorization layer.
- **SQL injection risk is mitigated** by `format('%I', p_stat_column)` which safely quotes identifiers, and by the explicit allowlist check (`p_stat_column NOT IN (...)` raises an exception for unknown columns).
- **The `actor_id` is set to `auth.uid()`** inside the function, not passed as a parameter — preventing spoofing of the actor identity.
- **Audit:** Any modification to these functions must be reviewed for authorization bypass. The functions are defined in `supabase/setup.sql` and `supabase/migration-001-multi-tenant.sql`.

## Cost Implications

- **Upfront:** Writing and testing two PL/pgSQL functions. Learning `SECURITY DEFINER` implications and `format()` / `EXECUTE` patterns.
- **Ongoing:** Maintaining both functions when stat types change. No automated tests — validation is manual QA. The functions themselves are free (no compute cost beyond normal PostgreSQL query execution).

## Success Metrics / Validation Criteria

- Stat counter and audit log are always in sync — no `stat_logs` entry exists without a corresponding `hub_members` update, and vice versa
- Concurrent +/- taps from multiple users on the same player produce correct final counts
- Invalid stat column names are rejected with an exception
- Non-members cannot invoke the function (internal membership check raises exception)
- Reassess if: new stat types are added frequently (consider a data-driven approach), transaction volume grows to a point where row-level locking causes contention, or Supabase Edge Functions become a simpler alternative

---
**Related ADRs:** [ADR-0001](../src/shared/lib/ADR-0001-supabase-sole-backend.md), [ADR-0004](ADR-0004-rls-sole-authorization.md), [ADR-0007](../src/features/hub/ADR-0007-optimistic-ui-realtime.md)
