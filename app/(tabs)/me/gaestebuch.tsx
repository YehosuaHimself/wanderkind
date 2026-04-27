import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { sanitizeText, isEmpty, enforceMaxLength, canPerformAction } from '../../../src/lib/validate';

type GaestebuchEntry = {
  id: string;
  host_id: string;
  walker_id: string;
  walker_name: string;
  message: string;
  rating: number | null;
  created_at: string;
};

type Reply = {
  id: string;
  entry_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { trail_name: string; avatar_url: string | null };
};

const REPLY_MAX = 400;

export default function GaestebuchScreen() {
  useAuthGuard();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GaestebuchEntry[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const { data: entryData } = await supabase
        .from('gaestebuch')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });
      const list = (entryData as GaestebuchEntry[]) || [];
      setEntries(list);

      if (list.length) {
        const ids = list.map(e => e.id);
        const { data: replyData } = await supabase
          .from('gaestebuch_replies')
          .select('*, author:profiles(trail_name, avatar_url)')
          .in('entry_id', ids)
          .order('created_at', { ascending: true });
        const grouped: Record<string, Reply[]> = {};
        for (const r of (replyData as any[]) || []) {
          (grouped[r.entry_id] = grouped[r.entry_id] || []).push(r);
        }
        setReplies(grouped);
      } else {
        setReplies({});
      }
    } catch (err) {
      console.error('fetch gaestebuch failed', err);
      toast.error('Could not load guest entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePostReply = async (entryId: string) => {
    if (!user) return;
    if (isEmpty(replyText)) { toast.error('Please write something'); return; }
    const sanitized = sanitizeText(replyText);
    if (!enforceMaxLength(sanitized, REPLY_MAX)) {
      toast.error(`Reply cannot exceed ${REPLY_MAX} characters`); return;
    }
    if (!canPerformAction('post-reply', 1500)) return;

    setSending(true);
    const optimistic: Reply = {
      id: `opt-${Date.now()}`,
      entry_id: entryId,
      author_id: user.id,
      content: sanitized,
      created_at: new Date().toISOString(),
      author: { trail_name: 'You', avatar_url: null },
    };
    setReplies(prev => ({ ...prev, [entryId]: [...(prev[entryId] || []), optimistic] }));
    setReplyText('');
    setOpenReply(null);

    try {
      const { data, error } = await supabase
        .from('gaestebuch_replies')
        .insert({ entry_id: entryId, author_id: user.id, content: sanitized })
        .select('*, author:profiles(trail_name, avatar_url)')
        .single();
      if (error) throw error;
      setReplies(prev => ({
        ...prev,
        [entryId]: (prev[entryId] || []).map(r => r.id === optimistic.id ? (data as any) : r),
      }));
    } catch (err) {
      console.error('post reply failed', err);
      toast.error('Reply failed');
      setReplies(prev => ({
        ...prev,
        [entryId]: (prev[entryId] || []).filter(r => r.id !== optimistic.id),
      }));
      setReplyText(sanitized);
    } finally {
      setSending(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={colors.gold} />
        ))}
      </View>
    );
  };

  const renderEntry = ({ item }: { item: GaestebuchEntry }) => {
    const entryReplies = replies[item.id] || [];
    const open = openReply === item.id;
    const date = new Date(item.created_at).toLocaleDateString(undefined,
      { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <WKCard style={styles.entryCard}>
        <View style={styles.entryHead}>
          <View style={styles.entryMeta}>
            <Text style={styles.walker}>{item.walker_name}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          {renderStars(item.rating)}
        </View>
        <Text style={styles.message}>{item.message}</Text>

        {entryReplies.length > 0 ? (
          <View style={styles.repliesBlock}>
            {entryReplies.map(r => (
              <View key={r.id} style={styles.replyRow}>
                <View style={styles.replyAvatar}>
                  {r.author?.avatar_url ? (
                    <Image source={{ uri: r.author.avatar_url }} style={styles.replyAvatarImg} />
                  ) : (
                    <Ionicons name="person" size={12} color={colors.ink3} />
                  )}
                </View>
                <View style={styles.replyBubble}>
                  <Text style={styles.replyAuthor}>{r.author?.trail_name ?? 'Wanderkind'}</Text>
                  <Text style={styles.replyContent}>{r.content}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {open ? (
          <View style={styles.replyComposer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply…"
              placeholderTextColor={colors.ink3}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={REPLY_MAX + 50}
              autoFocus
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                onPress={() => { setOpenReply(null); setReplyText(''); }}
                style={styles.replyCancel}
              >
                <Text style={styles.replyCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePostReply(item.id)}
                disabled={!replyText.trim() || sending || replyText.length > REPLY_MAX}
                style={[
                  styles.replySend,
                  (!replyText.trim() || sending || replyText.length > REPLY_MAX) && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="send" size={14} color="#fff" />
                <Text style={styles.replySendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => { setOpenReply(item.id); setReplyText(''); }}
            activeOpacity={0.7}
          >
            <Ionicons name="return-down-back-outline" size={14} color={colors.amber} />
            <Text style={styles.replyBtnText}>
              {entryReplies.length > 0 ? 'Add another reply' : 'Reply'}
            </Text>
          </TouchableOpacity>
        )}
      </WKCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Gästebuch" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Gästebuch" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAll(); }}
              tintColor={colors.amber}
            />
          }
          ListEmptyComponent={
            <WKEmpty
              icon="book-outline"
              title="No entries yet"
              message="Your guestbook fills up as walkers visit and leave their mark."
              iconColor={colors.amberLine}
            />
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },

  entryCard: { marginBottom: 0 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  entryMeta: { flex: 1 },
  walker: { ...typography.h3, color: colors.ink },
  date: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  message: { ...typography.body, color: colors.ink2, lineHeight: 22 },

  repliesBlock: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLt, gap: spacing.sm },
  replyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  replyAvatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  replyAvatarImg: { width: '100%', height: '100%' },
  replyBubble: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  replyAuthor: { fontSize: 11, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  replyContent: { fontSize: 12, color: colors.ink2, lineHeight: 17 },

  replyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.md, paddingVertical: 6,
  },
  replyBtnText: { fontSize: 12, fontWeight: '600', color: colors.amber, letterSpacing: 0.4 },

  replyComposer: {
    marginTop: spacing.md, padding: 10, backgroundColor: colors.amberBg,
    borderRadius: 8, borderWidth: 1, borderColor: colors.amberLine,
  },
  replyInput: {
    fontSize: 13, color: colors.ink, minHeight: 38, maxHeight: 100,
    backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8,
    marginBottom: 8,
  },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  replyCancel: { paddingHorizontal: 12, paddingVertical: 6 },
  replyCancelText: { fontSize: 12, color: colors.ink3, fontWeight: '600' },
  replySend: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.amber, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  replySendText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
