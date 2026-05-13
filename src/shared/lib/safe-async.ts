import { logger } from "./logger";

type SafeResult<T> = [T, null] | [null, Error];

export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string
): Promise<SafeResult<T>> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ err: error, context }, `${context}: unhandled error`);
    return [null, error];
  }
}
