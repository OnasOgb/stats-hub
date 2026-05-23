# Feature-Based Module Organization

**ID:** ADR-0003
**Status:** Accepted
**Date:** 2025-05-19

## Context

As StatsHub grew beyond a handful of components, the codebase needed a convention for where new code lives. The two common approaches in Next.js projects are:

1. **Technical-role folders** — `components/`, `hooks/`, `lib/`, `utils/` at the top level, grouping by file type
2. **Feature-based folders** — `features/{name}/` grouping all code for a domain concept together

Technical-role folders scatter related code across the tree: a chat message component, its data-fetching helper, its types, and its provider end up in four different directories. Feature-based folders keep them together, making it easy to understand, modify, or delete an entire feature.

## Decision

We organize application code under `src/features/{name}/` with sub-folders for `components/`, `lib/`, and `providers/` as needed. Cross-cutting code (Supabase clients, logger, shared UI) lives in `src/shared/`.

Current feature modules:

```
src/features/
  auth/components/        # Auth UI (AuthForm: sign-in/sign-up, OAuth, magic link)
  hub/
    components/           # Leaderboard, activity feed, chat, player profile, hub cards
    lib/                  # Domain types, queries, hooks (useRealtimeList, useStatMutation)
    providers/            # HubContext provider
  profile/
    components/           # ProfileForm, PlayerAvatar
```

Hub-scoped views (Leaderboard, Activity Feed, chat) live under `hub/`, not as separate features — they share types, context, and hooks, making independent feature modules unjustified.

Layout primitives (e.g., `BottomNav`) live in `src/shared/components/`, not in a feature folder — they are cross-cutting chrome, not domain features.

There are no barrel `index.ts` files. All imports use direct paths (e.g., `@/features/hub/components/HubChat`, not `@/features/hub`). The file system provides discoverability; barrels duplicate it without adding leverage.

Path aliases in `tsconfig.json` support this convention:

```
@/*          -> src/*
@/features/* -> src/features/*
@/shared/*   -> src/shared/*
```

## Consequences

### Positive
- **Cohesion** — all code for a feature (components, types, helpers, providers) is co-located; changes typically touch one directory
- **Discoverability** — a new contributor looking for "chat" code goes to `src/features/hub/components/HubChat.tsx`, not three different top-level folders
- **Deletability** — removing a feature means deleting one directory (plus route pages), not hunting across the tree
- **Scales naturally** — adding a new feature creates a new folder without affecting existing ones

### Negative
- **Cross-feature imports require judgment** — when feature A needs a component from feature B, it's a signal to move it to `shared/` or accept the coupling. No automated enforcement exists.
- **Route pages remain in `app/`** — Next.js App Router requires pages in the `app/` directory, so features have code in two places (route page in `app/`, components/logic in `src/features/`)
- **Inconsistent depth** — some features have only `components/`, others have `components/`, `lib/`, and `providers/`. This is by design (add sub-folders as needed) but can look inconsistent to newcomers.

## Alternatives Considered

### Technical-Role Folders (`components/`, `hooks/`, `lib/`)
- **Pros:** Simple; no decisions about which feature a file belongs to; common in tutorials and starter templates
- **Cons:** Related code is scattered; modifying a feature touches many directories; hard to understand feature boundaries
- **Rejected because:** StatsHub has 3 distinct features (hub, auth, profile) — technical-role folders would create a flat sea of 30+ files in `components/` with no grouping

### Domain-Driven Design (DDD) Bounded Contexts
- **Pros:** Stronger boundaries; explicit dependency rules; well-suited for large teams
- **Cons:** Overkill for a solo-maintained project with < 20 components per feature; DDD's ceremony (aggregates, repositories, domain events) adds complexity without proportional benefit at this scale
- **Rejected because:** Feature folders provide 80% of DDD's organizational benefit with none of the ceremony

### Flat `src/` with No Grouping
- **Pros:** Zero convention to learn; just put files wherever
- **Cons:** Becomes unnavigable at ~30 files; no discoverability; no deletability
- **Rejected because:** The project already exceeds this threshold

## Assumptions

- The number of features stays manageable (< 15). If the project grows to 30+ features, a grouping layer above features (e.g., `src/features/social/chat/`) may be needed.
- Cross-feature imports are rare and intentional. If features frequently import from each other, the feature boundaries may be wrong.
- `src/shared/` remains small (UI primitives, layout chrome like BottomNav, Supabase clients, logger, utilities). If shared code grows large, it should be re-evaluated for feature extraction.

## Scope

- **Applies to:** All application code in `src/features/` and `src/shared/`
- **Does not apply to:** Route pages in `app/` (dictated by Next.js App Router conventions), configuration files at the project root, or the `supabase/` directory

## Security Implications

No direct security implications. The module structure is an organizational convention — it does not affect authorization, data access, or attack surface.

## Cost Implications

- **Upfront:** Establishing the convention and migrating any existing flat files into feature folders. Minimal — done during initial project setup.
- **Ongoing:** New contributors need to learn the convention (documented in CONTEXT.md section 7). Path aliases (`@/features/*`) must be maintained in `tsconfig.json`.

## Success Metrics / Validation Criteria

- New features are created as `src/features/{name}/` without needing to be told
- Cross-feature imports are the exception, not the rule
- A feature can be understood by reading files within its directory (plus its route pages in `app/`)
- Reassess if: cross-feature imports become common (> 30% of imports), the number of features exceeds 15, or the `shared/` directory grows to rival individual features in size

---
**Related ADRs:** [ADR-0007](ADR-0007-optimistic-ui-realtime.md)
