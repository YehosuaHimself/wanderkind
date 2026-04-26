/**
 * Deterministic pass number generator.
 * Produces a permanent, stable pass number from a user ID.
 * Format: {PREFIX}-{XXXX}-{XXXX}
 *
 * Uses a simple hash of the userId — no Math.random(), no randomness.
 * Same userId always produces the same pass number.
 */

type PassType = 'wanderkind' | 'food' | 'hospitality' | 'water';

const PREFIXES: Record<PassType, string> = {
  wanderkind: 'WP',
  food: 'FP',
  hospitality: 'HP',
  water: 'WA',
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
 * @returns A formatted pass number like "WP-K4X8-R2M7"
 */
export function generatePassNumber(userId: string | undefined, passType: PassType): string {
  const prefix = PREFIXES[passType];

  if (!userId) return `${prefix}-0000-0000`;

  // Generate 8 characters deterministically
  const chars: string[] = [];
  for (let i = 0; i < 8; i++) {
    const h = hashString(userId, i * 7919 + passType.charCodeAt(0)); // 7919 is prime
    chars.push(CHARSET[h % CHARSET.length]);
  }

  const part1 = chars.slice(0, 4).join('');
  const part2 = chars.slice(4, 8).join('');

  return `${prefix}-${part1}-${part2}`;
}
