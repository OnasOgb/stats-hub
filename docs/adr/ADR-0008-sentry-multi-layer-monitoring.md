# Sentry Multi-Layer Monitoring with Tunnel Route

**ID:** ADR-0008
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub is deployed on Vercel and used on mobile devices where network conditions vary. Errors can occur in three distinct runtime environments — server (Node.js), edge (middleware), and client (browser) — each with different error propagation characteristics. A unified error monitoring solution needs to capture errors across all three layers, provide session replay for debugging client-side issues, and survive ad-blockers that strip Sentry's default ingestion endpoints.

Pino (ADR-0006) handles structured logging for server-side debugging, but it doesn't capture client-side errors, provide stack traces with source maps, or offer session replay. Sentry fills this gap.

## Decision

We configure Sentry across all three Next.js runtime layers with a tunnel route to bypass ad-blockers:

### Configuration Files
| File | Layer | Purpose |
|------|-------|---------|
| `sentry.server.config.ts` | Server (Node.js) | Server-side error capture, 10% trace sampling |
| `sentry.edge.config.ts` | Edge (middleware) | Edge runtime error capture, 10% trace sampling |
| `instrumentation-client.ts` | Client (browser) | Client error capture, session replay, route transition tracking |
| `instrumentation.ts` | Entrypoint | Conditionally imports server/edge configs based on `NEXT_RUNTIME` |
| `next.config.mjs` | Build | `withSentryConfig()` wrapper, source map upload, tunnel route, tree-shaking |

### Key Settings
- **`tracesSampleRate: 0.1`** — 10% of requests are traced (all three layers)
- **`replaysSessionSampleRate: 0.1`** — 10% of sessions are recorded
- **`replaysOnErrorSampleRate: 1.0`** — 100% of error sessions are recorded
- **`sendDefaultPii: false`** — no emails, names, or IP addresses sent; only UUID user IDs
- **`tunnelRoute: "/monitoring"`** — proxies Sentry events through a Next.js rewrite, bypassing ad-blockers
- **`enableLogs: true`** — Sentry's structured logging is enabled across all layers
- **`widenClientFileUpload: true`** — uploads broader source maps for better stack traces
- **`removeDebugLogging: true`** — tree-shakes Sentry debug log statements from production bundles

### Error Boundaries
- `app/error.tsx` — page-level error boundary; calls `Sentry.captureException()` with `extra` context
- `app/global-error.tsx` — app-level fallback; also reports to Sentry
- Client components use `Sentry.captureException(error, { extra: { context: "..." } })` for inline error reporting

### Request Error Capture
- `instrumentation.ts` exports `onRequestError = Sentry.captureRequestError` for automatic server-side request error capture
- `instrumentation-client.ts` exports `onRouterTransitionStart = Sentry.captureRouterTransitionStart` for client-side navigation tracking

## Consequences

### Positive
- **Full-stack visibility** — errors in server components, middleware, and client code all appear in one Sentry dashboard
- **Session replay on errors** — 100% of error sessions are recorded, providing exact reproduction steps without asking users
- **Ad-blocker resilience** — the `/monitoring` tunnel route means client-side errors are captured even when Sentry's domain is blocked
- **Source maps** — stack traces show original TypeScript source, not minified production code
- **Low overhead** — 10% sampling for traces/replays keeps performance impact and Sentry billing manageable
- **PII-safe** — `sendDefaultPii: false` ensures no personal data leaks to Sentry

### Negative
- **Sentry adds bundle size** — the client SDK, replay integration, and instrumentation add to the JavaScript bundle
- **Tunnel route adds server load** — every client-side Sentry event proxies through the Next.js server, adding request volume and bandwidth
- **90% of non-error sessions are not recorded** — debugging a non-error UX issue requires reproducing it or increasing the sample rate
- **No correlation with Pino logs** — there's no shared trace ID between a Pino log line and a Sentry event. Debugging requires cross-referencing timestamps manually.
- **Three config files to maintain** — server, edge, and client configs must be kept in sync for settings like `tracesSampleRate` and `sendDefaultPii`

## Alternatives Considered

### Pino-Only (No Error Monitoring Service)
- **Pros:** No additional vendor; lower bundle size; simpler stack
- **Cons:** No client-side error capture; no session replay; no source-mapped stack traces; no alerting or dashboards; logs are unstructured text, not queryable error events
- **Rejected because:** Client-side errors and session replay are essential for debugging mobile UX issues that cannot be reproduced locally

### Vercel Analytics + Log Drain
- **Pros:** Native Vercel integration; no additional SDK; captures web vitals
- **Cons:** No session replay; no error grouping or deduplication; no alerting; limited to Vercel's ecosystem
- **Rejected because:** Does not provide error monitoring, only performance analytics

### LogRocket / FullStory
- **Pros:** Excellent session replay; user journey visualization; UI-focused debugging
- **Cons:** Focused on frontend only; no server/edge error capture; higher cost; PII concerns with full session recording
- **Rejected because:** StatsHub needs multi-layer error capture (server + edge + client), not just frontend replay

### Self-Hosted Sentry
- **Pros:** No vendor billing; full control over data; same SDK
- **Cons:** Requires infrastructure management (Docker, PostgreSQL, Redis, Kafka); operational overhead is prohibitive for a solo project
- **Rejected because:** The operational burden of self-hosting outweighs the cost savings for a solo-maintained project

## Assumptions

- Sentry's free tier (5k errors/month, 50 replays/session) or Team tier is sufficient for the project's scale.
- The `/monitoring` tunnel route does not conflict with Next.js middleware matchers (currently excluded from middleware via `config.matcher`).
- 10% trace and replay sampling provides enough data for debugging without excessive cost. If error rates spike, the 100% on-error replay rate compensates.
- `sendDefaultPii: false` is sufficient for privacy compliance. If user identification is needed in Sentry, only UUID-based `Sentry.setUser({ id })` calls should be used.

## Scope

- **Applies to:** Error monitoring, performance tracing, and session replay across all three Next.js runtime layers (server, edge, client)
- **Does not apply to:** Structured application logging (ADR-0006 / Pino), uptime monitoring, or synthetic testing

## Security Implications

- **`sendDefaultPii: false`** prevents Sentry from automatically capturing IP addresses, cookies, or form data. Only explicitly attached data (UUID user IDs via `Sentry.setUser`) reaches Sentry.
- **Source maps are uploaded to Sentry** during build. They are not served publicly — Sentry uses them server-side to de-minify stack traces. The `SENTRY_AUTH_TOKEN` is required for upload and is stored as an environment variable (not in code).
- **The tunnel route (`/monitoring`)** proxies arbitrary POST payloads to Sentry's ingestion endpoint. The `@sentry/nextjs` tunnel implementation validates the envelope format, but this route adds a small attack surface (potential for abuse as a proxy).
- **Error context (`extra` data)** attached in `Sentry.captureException()` calls may inadvertently include sensitive data. Review `extra` payloads when adding new error captures.

## Cost Implications

- **Upfront:** Sentry SDK setup across three layers, source map upload configuration, tunnel route setup. Done during initial project setup.
- **Ongoing:** Sentry billing based on error volume, replay sessions, and trace count. Currently within free tier limits. The tunnel route adds marginal server load and bandwidth to Vercel (each Sentry event from the client becomes a server request). Source map uploads add ~10-15s to each production build.

## Success Metrics / Validation Criteria

- Errors from all three layers (server, edge, client) appear in the Sentry dashboard with readable stack traces
- Session replays are available for 100% of error sessions
- Client-side errors are captured even with ad-blockers enabled (tunnel route works)
- `sendDefaultPii: false` is verified — no email addresses or names appear in Sentry events
- Reassess if: Sentry billing exceeds budget, the tunnel route causes measurable server load, Pino-Sentry correlation (shared trace IDs) becomes necessary, or an alternative monitoring service offers better value

---
**Related ADRs:** [ADR-0006](src/shared/lib/ADR-0006-pino-stdout-no-transports.md), [ADR-0001](src/shared/lib/ADR-0001-supabase-sole-backend.md)
