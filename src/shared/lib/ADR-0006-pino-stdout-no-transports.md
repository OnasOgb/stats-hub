# Pino JSON Stdout with pino-pretty Pipe in Development

**ID:** ADR-0006
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub needs structured logging for debugging and operational visibility. Pino is the standard high-performance JSON logger for Node.js. However, Next.js bundles server code with webpack, which breaks Pino's transport mechanism — transports use Node.js worker threads that webpack cannot bundle. Attempting to configure `pino({ transport: { target: 'pino-pretty' } })` in a Next.js project causes build failures or runtime crashes.

Additionally, Next.js requires Pino to be listed in `serverComponentsExternalPackages` in `next.config.mjs` to prevent webpack from attempting to bundle it.

## Decision

We configure Pino to write JSON to stdout with **no transports**. In development, the npm `dev` script pipes Next.js output through `pino-pretty` as an external process:

```json
"dev": "next dev | pino-pretty --colorize"
```

The logger is defined in `src/shared/lib/logger.ts`:

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
});
```

Module-specific child loggers provide context:
- `dbLogger` — database operations
- `authLogger` — authentication
- `hubLogger` — hub operations
- `pageLogger` — page-level logging
- `mwLogger` — middleware (defined in `middleware.ts`)

Pino is externalized from webpack in `next.config.mjs`:

```javascript
experimental: {
  serverComponentsExternalPackages: ["pino"],
}
```

## Consequences

### Positive
- **No webpack bundling issues** — Pino writes plain JSON to stdout; no worker threads, no transports, nothing for webpack to break
- **Human-readable dev logs** — `pino-pretty --colorize` formats JSON into colorized, readable output in the terminal
- **Production-ready format** — JSON stdout is the standard input for log aggregation tools (Vercel Logs, Datadog, etc.)
- **Module context** — child loggers add `{ module: "db" }` etc. to every log line, making it easy to filter by subsystem
- **`LOG_LEVEL` control** — verbosity is configurable via environment variable without code changes

### Negative
- **Dev script is shell-specific** — the pipe (`|`) assumes a Unix-like shell; Windows developers need WSL or a different approach
- **No log persistence** — logs go to stdout only; there's no file rotation, no remote shipping, no log buffer. If stdout is not captured (e.g., background process), logs are lost.
- **No structured error tracking in logs** — errors in logs are separate from Sentry (ADR-0008). There's no correlation ID linking a log line to a Sentry event.
- **Child logger creation is manual** — each new module must create its own child logger; there's no auto-instrumentation

## Alternatives Considered

### Pino with Built-in Transports (`pino-pretty` as transport)
- **Pros:** Cleaner dev experience (no pipe); transport configured in code; same `logger.ts` works in dev and prod
- **Cons:** Breaks in Next.js due to webpack bundling worker threads; `serverComponentsExternalPackages` doesn't fully resolve the issue for transports
- **Rejected because:** This was the first approach tried and it caused runtime crashes in Next.js server components

### Winston
- **Pros:** Widely used; built-in transport system; formatters for console output
- **Cons:** Slower than Pino in benchmarks; transport system has the same webpack bundling issues in Next.js; larger dependency footprint
- **Rejected because:** Same webpack incompatibility problem, with lower performance

### `console.log` with a Wrapper
- **Pros:** Zero dependencies; works everywhere; no webpack issues
- **Cons:** No structured output; no log levels; no child loggers; hard to filter in production; not machine-parseable
- **Rejected because:** Unstructured logs are not viable for production debugging or log aggregation

### Next.js Built-in Logging
- **Pros:** No additional dependency; works with App Router
- **Cons:** Minimal functionality; no structured JSON; no child loggers; no log level control
- **Rejected because:** Insufficient for operational needs

## Assumptions

- All deployments (Vercel) capture stdout and make it searchable. If a deployment target doesn't capture stdout, a log shipping solution would be needed.
- The `pino-pretty` pipe in the dev script is acceptable UX for all contributors (Unix-like shell availability).
- Five module-specific child loggers are sufficient. If more are needed, the pattern is easy to extend.
- `LOG_LEVEL` defaults (`debug` in development, `info` in production) are appropriate for the project's needs.

## Scope

- **Applies to:** All server-side logging throughout the application — server components, middleware, and any server-side utility code
- **Does not apply to:** Client-side logging (browser console), Sentry error reporting (ADR-0008), or Next.js internal logging

## Security Implications

- Pino logs may contain sensitive data if developers log request bodies or user data. The current child loggers do not automatically attach PII — but care must be taken when adding new log statements.
- `LOG_LEVEL=debug` in production would increase log volume and potentially expose internal state. The default production level is `info`.
- Log output is not encrypted or authenticated — it relies on the deployment platform's security for stdout capture.

## Cost Implications

- **Upfront:** Adding Pino dependency, creating `logger.ts`, configuring `serverComponentsExternalPackages`, and setting up the dev script pipe. Minimal.
- **Ongoing:** `pino` and `pino-pretty` dependency maintenance. Vercel log retention is included in the deployment plan. No additional log aggregation costs unless a third-party service is added.

## Success Metrics / Validation Criteria

- `npm run dev` produces colorized, human-readable logs in the terminal
- Production logs are valid JSON lines parseable by log aggregation tools
- Each log line includes the module name (`db`, `auth`, `hub`, `page`, `middleware`)
- No webpack build errors related to Pino
- Reassess if: a log aggregation service is adopted that requires a specific transport, Next.js resolves the webpack/worker-thread incompatibility with Pino transports, or a correlation ID with Sentry is needed

---
**Related ADRs:** [ADR-0008](../../../ADR-0008-sentry-multi-layer-monitoring.md)
