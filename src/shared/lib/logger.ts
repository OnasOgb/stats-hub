import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Pino writes JSON to stdout. In dev, the "dev" npm script pipes output
// through pino-pretty for human-readable formatting. This avoids worker-thread
// and webpack bundling issues that pino transports cause in Next.js.
const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
});

export const dbLogger = logger.child({ module: "db" });
export const authLogger = logger.child({ module: "auth" });
export const hubLogger = logger.child({ module: "hub" });
export const pageLogger = logger.child({ module: "page" });

export { logger };
export default logger;
