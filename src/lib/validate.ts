/**
 * Input validation and sanitization for production safety.
 * Prevents XSS, enforces limits, sanitizes user-generated content.
 */

/** Strip HTML tags and entities to prevent XSS when rendering user content */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+\s*=/gi, '') // Strip event handlers
    .replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, '') // Strip HTML entities
    .replace(/data:/gi, '') // Strip data: URIs
    .trim();
}

/** Enforce max length with user feedback */
export function enforceMaxLength(input: string, maxLength: number): string {
  return input.slice(0, maxLength);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Check if text is empty or only whitespace */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/** Validate photo file before upload */
export function validatePhoto(file: {
  uri: string;
  fileSize?: number;
  type?: string;
}): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (file.fileSize && file.fileSize > MAX_SIZE) {
    return { valid: false, error: 'Photo is too large. Maximum size is 10MB.' };
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Unsupported photo format. Use JPEG, PNG, or WebP.' };
  }

  return { valid: true };
}

/** Content length limits for different field types */
export const LIMITS = {
  trailName: 40,
  bio: 500,
  blogTitle: 200,
  blogContent: 50000,
  messageText: 5000,
  stampNote: 1000,
  stampReflection: 2000,
  hostDescription: 2000,
  projectDescription: 1000,
  reportReason: 500,
  searchQuery: 100,
} as const;

/** Rate limiter — prevents rapid-fire submissions */
const lastAction: Record<string, number> = {};
const MAX_ACTION_KEYS = 100;

export function canPerformAction(key: string, cooldownMs = 2000): boolean {
  const now = Date.now();
  const last = lastAction[key] || 0;
  if (now - last < cooldownMs) return false;
  lastAction[key] = now;

  // Prevent unbounded memory growth — prune stale entries
  const keys = Object.keys(lastAction);
  if (keys.length > MAX_ACTION_KEYS) {
    const staleThreshold = now - 60000; // 1 minute
    for (const k of keys) {
      if (lastAction[k] < staleThreshold) delete lastAction[k];
    }
  }
  return true;
}
