# Optimistic UI with Supabase Realtime Reconciliation

**ID:** ADR-0007
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub is a mobile-first app where perceived responsiveness is critical. Two core interactions — sending chat messages and updating player stats — involve writes to Supabase that take 100-300ms on a typical mobile connection. Waiting for the server round-trip before updating the UI creates noticeable lag that feels broken on a real-time leaderboard and chat.

Supabase Realtime provides `postgres_changes` subscriptions that push row-level changes to connected clients. This creates a reconciliation mechanism: the client can show changes immediately (optimistic update) and then confirm or revert when the database change arrives via the realtime channel.

## Decision

We use optimistic UI updates for both chat messages and stat mutations. The pattern is:

Both patterns are abstracted into reusable hooks in `src/features/hub/lib/`:

### Realtime lists — `useRealtimeList` hook
Used by `HubChat.tsx`, `ActivityFeed.tsx`, and `LeaderboardClient.tsx`. The hook manages:
1. **Supabase channel subscription** — subscribes to `postgres_changes` for a given table/hub
2. **Optimistic inserts** — `addOptimistic()` appends an item with a `pending` flag immediately
3. **Confirmation** — on realtime INSERT, the pending flag is removed via de-duplication (`pendingIds` Set)
4. **Revert** — `revertOptimistic()` removes the item and shows a toast on error
5. **UPDATE/DELETE** — merges updates and filters deletions from local state

### Stat mutations — `useStatMutation` hook
Used by `PlayerProfileClient.tsx` (stat +/−) and `ActivityFeed.tsx` (stat log revert). The hook provides:
1. **`changeStat`** — calls the appropriate RPC (`increment_hub_stat` / `decrement_hub_stat`) with `onOptimistic` / `onRevert` / `onSuccess` callbacks
2. **`revertStatLog`** — reverses a stat change and deletes the corresponding Stat Log entry
3. **Error reporting** — delegates to the shared `mutate()` wrapper for Sentry + toast

Key implementation details:
- Chat messages use `useRealtimeList` with `addOptimistic` / `revertOptimistic` for the optimistic insert/confirm/revert cycle
- Stats use `useStatMutation` with callback-based optimistic state; `PlayerProfileClient` calls `router.refresh()` on success to revalidate server-component data
- Both hooks report errors to Sentry with `extra` context for debugging

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

- **Applies to:** Chat message sending (`HubChat.tsx`), stat increment/decrement (`PlayerProfileClient.tsx`), stat log revert (`ActivityFeed.tsx`), and realtime list updates (`LeaderboardClient.tsx`). The two reusable hooks — `useRealtimeList` and `useStatMutation` — centralize these patterns in `src/features/hub/lib/`
- **Does not apply to:** Read-only data fetching (server components), profile updates, hub creation, or joining hubs — these use standard request/response without optimistic updates

## Security Implications

- Optimistic updates do not bypass server-side validation. The RPC functions (ADR-0002) and RLS policies (ADR-0004) still enforce authorization. A rejected write simply causes the UI to revert.
- The client-generated UUID for chat messages is used as the primary key. This is safe because the `messages` table has a UUID primary key with `DEFAULT gen_random_uuid()` — the client-provided ID is accepted if it's a valid UUID.
- Error details are sent to Sentry but not displayed to the user (only a generic toast). This prevents leaking database error messages to the client.

## Cost Implications

- **Upfront:** Implementing optimistic update logic and de-duplication, now centralized in two reusable hooks (`useRealtimeList`, `useStatMutation`). Already done.
- **Ongoing:** Each new feature with write operations must decide whether to use optimistic updates. New realtime lists can use `useRealtimeList`; new stat-like mutations can follow the `useStatMutation` pattern. The hooks handle channel lifecycle, de-duplication, and error reporting — new consumers only provide callbacks.

## Success Metrics / Validation Criteria

- Chat messages appear instantly for the sender (< 50ms from tap to visible)
- Stat updates reflect immediately in the UI counter
- Failed writes revert the UI and show a user-visible error (toast)
- No duplicate messages appear in the chat (de-duplication works correctly)
- Reassess if: realtime event delivery becomes unreliable (pending messages stick), stat mutation frequency increases significantly, or a query cache library is adopted for other reasons

---
**Related ADRs:** [ADR-0001](../../shared/lib/ADR-0001-supabase-sole-backend.md), [ADR-0002](../../../supabase/ADR-0002-atomic-rpc-stat-mutations.md)
