/**
 * Local-only message persistence for seed-profile conversations.
 *
 * Seed profiles (id starts with `p-`) are NPCs — the user can text them
 * but they never reply. We persist outgoing messages in AsyncStorage so
 * the conversation survives app restarts but never touches Supabase.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'wk-seed-messages:';
const INDEX_KEY = 'wk-seed-thread-index';

export type SeedMessage = {
  id: string;
  thread_id: string;       // 'seed:p-XXX'
  sender_id: 'me';         // always the local user
  content: string;
  created_at: string;
};

const keyFor = (profileId: string) => `${KEY_PREFIX}${profileId}`;

export async function loadSeedMessages(profileId: string): Promise<SeedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendSeedMessage(profileId: string, content: string): Promise<SeedMessage> {
  const msg: SeedMessage = {
    id: `seed-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    thread_id: `seed:${profileId}`,
    sender_id: 'me',
    content,
    created_at: new Date().toISOString(),
  };
  const list = await loadSeedMessages(profileId);
  list.push(msg);
  await AsyncStorage.setItem(keyFor(profileId), JSON.stringify(list));

  // Maintain an index of seed threads the user has started, so the
  // messages list can surface them.
  try {
    const idxRaw = await AsyncStorage.getItem(INDEX_KEY);
    const idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
    if (!idx.includes(profileId)) {
      idx.unshift(profileId);
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    }
  } catch {
    // index is best-effort
  }
  return msg;
}

export async function listSeedThreads(): Promise<Array<{ profileId: string; lastMessage: SeedMessage | null }>> {
  try {
    const idxRaw = await AsyncStorage.getItem(INDEX_KEY);
    const idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
    const out = [];
    for (const profileId of idx) {
      const list = await loadSeedMessages(profileId);
      out.push({ profileId, lastMessage: list.length ? list[list.length - 1] : null });
    }
    return out;
  } catch {
    return [];
  }
}

export function isSeedProfileId(id: string | undefined | null): boolean {
  return !!id && typeof id === 'string' && id.startsWith('p-');
}
