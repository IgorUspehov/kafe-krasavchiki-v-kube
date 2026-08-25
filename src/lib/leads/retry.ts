/** Shared retry helper for lead capture (front + server). */

export type RetryOptions = {
  attempts?: number;
  /** Base delay in ms; attempt n waits base * 2^(n-1). */
  baseDelayMs?: number;
  /** Max delay cap. */
  maxDelayMs?: number;
  /** Return false to stop retrying (e.g. 4xx validation). */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exp = Math.max(0, attempt - 1);
  return Math.min(maxDelayMs, baseDelayMs * 2 ** exp);
}

/**
 * Run `fn` up to `attempts` times with exponential backoff.
 * attempt is 1-based in onRetry / shouldRetry.
 */
export async function withRetries<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 300;
  const maxDelayMs = options.maxDelayMs ?? 2_000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < attempts && shouldRetry(error, attempt);
      if (!canRetry) break;
      const delayMs = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

export class LeadRequestError extends Error {
  status: number;
  body: unknown;
  retryable: boolean;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "LeadRequestError";
    this.status = status;
    this.body = body;
    // Retry transient server / gateway failures only — never validation (4xx except 408/429).
    this.retryable = status === 0 || status === 408 || status === 429 || status >= 500;
  }
}

export function isRetryableLeadError(error: unknown): boolean {
  if (error instanceof LeadRequestError) return error.retryable;
  // Network / abort / parse failures
  return true;
}
