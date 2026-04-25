import { supabase } from './supabase';

export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  return !error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  return !error;
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .single();
  return !!data;
}

export async function getBlockedUsers(userId: string) {
  const { data } = await supabase
    .from('blocked_users')
    .select('*, blocked:profiles!blocked_users_blocked_id_fkey(*)')
    .eq('blocker_id', userId);
  return data || [];
}
