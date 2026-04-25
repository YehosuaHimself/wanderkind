/**
 * Lightweight toast notification system for production error feedback.
 * Uses a simple event emitter pattern — no external dependencies.
 */

type ToastType = 'error' | 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

type Listener = (toast: Toast) => void;

const listeners: Set<Listener> = new Set();
let idCounter = 0;

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(type: ToastType, message: string, duration = 3500) {
  const toast: Toast = { id: `toast-${++idCounter}`, type, message, duration };
  listeners.forEach(fn => fn(toast));
}

export const toast = {
  error: (message: string, duration?: number) => emit('error', message, duration),
  success: (message: string, duration?: number) => emit('success', message, duration),
  info: (message: string, duration?: number) => emit('info', message, duration),
  warning: (message: string, duration?: number) => emit('warning', message, duration),
};

/**
 * Safe async wrapper — catches errors and shows toast.
 * Returns [data, error] tuple.
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage = 'Something went wrong. Please try again.',
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[safeAsync]', error.message);
    toast.error(errorMessage);
    return [null, error];
  }
}
