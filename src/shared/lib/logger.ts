import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

export const dbLogger = logger.child({ module: "db" });
export const authLogger = logger.child({ module: "auth" });
export const hubLogger = logger.child({ module: "hub" });

export { logger };
export default logger;
