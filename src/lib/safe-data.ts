/**
 * Defensive data utilities — prevent crashes from null/undefined data.
 * Apple-quality: no screen ever shows "undefined" or crashes on missing data.
 */

import { toast } from './toast';

/** Safe Supabase query wrapper — catches errors, shows toast, returns fallback */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  context?: string,
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn(`[safeQuery] ${context || 'query'} error:`, error.message);
      toast.error('Something went wrong. Please try again.');
      return fallback;
    }
    return data ?? fallback;
  } catch (err: any) {
    console.warn(`[safeQuery] ${context || 'query'} exception:`, err?.message);
    toast.error('Connection issue. Please check your network.');
    return fallback;
  }
}

/** Safe mutation wrapper — catches errors, shows success/error toast */
export async function safeMutation(
  mutationFn: () => Promise<{ error: any }>,
  options?: { successMessage?: string; errorMessage?: string; context?: string },
): Promise<boolean> {
  try {
    const { error } = await mutationFn();
    if (error) {
      console.warn(`[safeMutation] ${options?.context || 'mutation'} error:`, error.message);
      toast.error(options?.errorMessage || 'Could not save. Please try again.');
      return false;
    }
    if (options?.successMessage) {
      toast.success(options.successMessage);
    }
    return true;
  } catch (err: any) {
    console.warn(`[safeMutation] ${options?.context || 'mutation'} exception:`, err?.message);
    toast.error(options?.errorMessage || 'Connection issue. Please try again.');
    return false;
  }
}

/** Safe string access — never returns undefined */
export function safeStr(value: any, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/** Safe number access — never returns NaN */
export function safeNum(value: any, fallback = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/** Safe array access — never returns undefined */
export function safeArr<T>(value: T[] | null | undefined, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}
