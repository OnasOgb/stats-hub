# Optimistic UI with Supabase Realtime Reconciliation

**ID:** ADR-0007
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub is a mobile-first app where perceived responsiveness is critical. Two core interactions — sending chat messages and updating player stats — involve writes to Supabase that take 100-300ms on a typical mobile connection. Waiting for the server round-trip before updating the UI creates noticeable lag that feels broken on a real-time leaderboard and chat.

Supabase Realtime provides `postgres_changes` subscriptions that push row-level changes to connected clients. This creates a reconciliation mechanism: the client can show changes immediately (optimistic update) and then confirm or revert when the database change arrives via the realtime channel.

## Decision

We use optimistic UI updates for both chat messages and stat mutations. The pattern is:

### Chat (`HubChat.tsx`)
1. **Generate a UUID client-side** (`crypto.randomUUID()`)
2. **Append the message to local state immediately** with a `pending` flag
3. **Insert into `messages` table** via `supabase.from('messages').insert()`
4. **On realtime INSERT event** from the same sender, remove the pending flag (confirm)
5. **On insert error**, remove the optimistic message and show a toast error

### Stats (`PlayerProfileClient.tsx`)
1. **Update local `stats` state immediately** (increment/decrement, floored at 0)
2. **Call the RPC function** (`increment_hub_stat` / `decrement_hub_stat`) via `supabase.rpc()`
3. **On RPC error**, revert the local state to the previous value
4. **On success**, call `router.refresh()` to revalidate server-component data

Key implementation details:
- Chat messages use a `pendingIds` Set to track unconfirmed messages and a de-duplication check (`prev.some(m => m.id === data.id)`) to prevent doubles when the realtime event arrives
- Stats use simple state rollback (`prev[stat] - delta`) on error, without realtime subscription (the `router.refresh()` fetches fresh data from the server)
- Both patterns report errors to Sentry with `extra` context for debugging

## Consequences

### Positive
- **Instant feedback** — UI updates in < 10ms instead of waiting 100-300ms for the server
- **Chat feels real-time** — messages appear immediately for the sender; other clients see them via realtime subscription
- **Stat updates feel snappy** — tap +/- and the counter changes immediately
- **Error recovery** — failed operations are reverted with user notification (toast), not silently lost

### Negative
- **Brief inconsistency window** — for the duration of the server round-trip, the UI shows unconfirmed data. If the server rejects the write, the UI reverts visibly.
- **Complexity in message de-duplication** — the realtime handler must skip messages that are already in local state (optimistic) to avoid showing duplicates
- **Stats lack realtime reconciliation** — `PlayerProfileClient` reverts on error but relies on `router.refresh()` for truth, meaning another user's concurrent change won't appear until the page is refreshed or navigated to
- **No retry logic** — if the server write fails, the operation is simply reverted. The user must manually retry.

## Alternatives Considered

### Server-Wait UI (No Optimistic Updates)
- **Pros:** UI always shows confirmed state; no de-duplication or rollback logic; simpler components
- **Cons:** 100-300ms delay on every interaction; chat feels laggy; stat updates feel unresponsive on mobile
- **Rejected because:** The perceived latency is unacceptable for a mobile-first real-time app

### Full Optimistic + Realtime for Stats (Like Chat)
- **Pros:** Other users see stat changes instantly without page refresh; consistent pattern across features
- **Cons:** Requires a realtime subscription on `hub_members` in `PlayerProfileClient` (currently not subscribed); adds complexity for a lower-frequency interaction (stats are updated less often than chat messages)
- **Rejected because:** Stats are updated infrequently enough that `router.refresh()` is sufficient. The leaderboard page already has realtime subscriptions; adding them to the individual player profile page would add complexity without proportional UX benefit.

### React Query / SWR Mutation with Optimistic Updates
- **Pros:** Built-in cache management, rollback, and retry; standardized pattern
- **Cons:** Adds a dependency; duplicates what Supabase Realtime already provides for cache invalidation; another abstraction layer to learn
- **Rejected because:** The project already has realtime subscriptions for reconciliation; adding a query cache library would be redundant for the current feature set

## Assumptions

- Network latency for Supabase writes is typically 100-300ms. If it frequently exceeds 1s, the optimistic UI inconsistency window becomes noticeable and retry logic may be needed.
- `crypto.randomUUID()` produces unique IDs without collisions (standard guarantee).
- Supabase Realtime delivers INSERT events reliably and in order. If events are dropped, the pending flag on chat messages would persist indefinitely (no timeout exists).
- The `router.refresh()` pattern for stats is acceptable because stat mutations are low-frequency (a few per session, not per second).

## Scope

- **Applies to:** Chat message sending (`HubChat.tsx`) and stat increment/decrement (`PlayerProfileClient.tsx`)
- **Does not apply to:** Read-only data fetching (server components), profile updates, hub creation, or joining hubs — these use standard request/response without optimistic updates

## Security Implications

- Optimistic updates do not bypass server-side validation. The RPC functions (ADR-0002) and RLS policies (ADR-0004) still enforce authorization. A rejected write simply causes the UI to revert.
- The client-generated UUID for chat messages is used as the primary key. This is safe because the `messages` table has a UUID primary key with `DEFAULT gen_random_uuid()` — the client-provided ID is accepted if it's a valid UUID.
- Error details are sent to Sentry but not displayed to the user (only a generic toast). This prevents leaking database error messages to the client.

## Cost Implications

- **Upfront:** Implementing optimistic update logic and de-duplication in two components. Moderate complexity, already done.
- **Ongoing:** Each new feature with write operations must decide whether to use optimistic updates. The pattern is established but not abstracted into a reusable hook — each component implements it independently.

## Success Metrics / Validation Criteria

- Chat messages appear instantly for the sender (< 50ms from tap to visible)
- Stat updates reflect immediately in the UI counter
- Failed writes revert the UI and show a user-visible error (toast)
- No duplicate messages appear in the chat (de-duplication works correctly)
- Reassess if: realtime event delivery becomes unreliable (pending messages stick), stat mutation frequency increases significantly, or a query cache library is adopted for other reasons

---
**Related ADRs:** [ADR-0001](../../shared/lib/ADR-0001-supabase-sole-backend.md), [ADR-0002](../../../supabase/ADR-0002-atomic-rpc-stat-mutations.md)
