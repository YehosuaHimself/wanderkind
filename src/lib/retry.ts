/**
 * Retry wrapper with exponential backoff for Supabase operations.
 * Use for critical reads (profile, hosts, stamps) that should survive transient failures.
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 500, maxDelay = 5000 } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on auth errors or not-found
      const message = lastError.message.toLowerCase();
      if (
        message.includes('jwt') ||
        message.includes('auth') ||
        message.includes('not found') ||
        message.includes('pgrst116')
      ) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        const jitter = delay * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, jitter));
      }
    }
  }

  throw lastError!;
}

/**
 * Safe Supabase query wrapper — handles the {data, error} pattern.
 * Returns data or throws so it works with withRetry.
 */
export async function queryOrThrow<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
): Promise<T> {
  const { data, error } = await queryFn();
  if (error) throw new Error(error.message || 'Query failed');
  if (data === null) throw new Error('No data returned');
  return data;
}
