/**
 * Deterministic pass number generator.
 * Produces a permanent, stable pass number from a user ID.
 * Format: {P}{XXXXXXXX} — 9 characters total, like a real passport number.
 *
 * Uses a simple hash of the userId — no Math.random(), no randomness.
 * Same userId always produces the same pass number.
 */

type PassType = 'wanderkind' | 'food' | 'hospitality' | 'water';

// Single-letter prefix per pass type (like country codes on real passports)
const PREFIXES: Record<PassType, string> = {
  wanderkind: 'W',
  food: 'F',
  hospitality: 'H',
  water: 'A',
};

// Alphanumeric characters for pass number (no ambiguous chars like 0/O, 1/I/l)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Simple deterministic hash function.
 * Produces a 32-bit integer from a string + salt.
 */
function hashString(str: string, salt: number = 0): number {
  let hash = salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic pass number for a given user and pass type.
 *
 * @param userId - The user's UUID
 * @param passType - The type of pass
 * @returns A formatted pass number like "W48KR2M7X" (9 chars, like a real passport)
 */
export function generatePassNumber(userId: string | undefined, passType: PassType): string {
  const prefix = PREFIXES[passType];

  if (!userId) return `${prefix}00000000`;

  // Generate 8 characters deterministically (prefix + 8 = 9 total, like real passports)
  const chars: string[] = [];
  for (let i = 0; i < 8; i++) {
    const h = hashString(userId, i * 7919 + passType.charCodeAt(0)); // 7919 is prime
    chars.push(CHARSET[h % CHARSET.length]);
  }

  return `${prefix}${chars.join('')}`;
}
