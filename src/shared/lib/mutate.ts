import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

interface MutateOptions {
  /** The Supabase operation to execute (Promise or PromiseLike). */
  fn: () => PromiseLike<{ error: any }>;
  /** Human-readable label for Sentry (e.g. "HubCard: leave hub"). */
  context: string;
  /** Additional IDs / state to attach to the Sentry event. */
  extra?: Record<string, unknown>;
  /** If provided, shows a toast on error. */
  errorMessage?: string;
}

/**
 * Executes a Supabase mutation, reports failures to Sentry with structured
 * context, and optionally shows a user-facing toast. Returns the error so
 * the caller can handle revert / success logic.
 */
export async function mutate({
  fn,
  context,
  extra,
  errorMessage,
}: MutateOptions): Promise<{ error: any | null }> {
  const { error } = await fn();
  if (error) {
    Sentry.captureException(error, { extra: { context, ...extra } });
    if (errorMessage) toast.error(errorMessage);
  }
  return { error };
}
