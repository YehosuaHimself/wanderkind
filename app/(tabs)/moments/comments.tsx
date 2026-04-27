/**
 * Moments · Comments thread (WK-110)
 * Read existing comments + post a new one.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, isEmpty, enforceMaxLength, canPerformAction } from '../../../src/lib/validate';

const MAX_LEN = 500;

type CommentRow = {
  id: string;
  moment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    trail_name: string;
    avatar_url: string | null;
  };
};

export default function CommentsList() {
  useAuthGuard();
  const router = useRouter();
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const { user, profile } = useAuth();

  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const fetchComments = useCallback(async () => {
    if (!momentId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, author:profiles(id, trail_name, avatar_url)')
        .eq('moment_id', momentId)
        .order('created_at', { ascending: true });
      setComments((data as any[]) || []);
    } catch (err) {
      console.error('fetch comments failed', err);
    } finally {
      setLoading(false);
    }
  }, [momentId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async () => {
    if (!user || !momentId) return;
    if (isEmpty(text)) { toast.error('Please write something'); return; }
    const sanitized = sanitizeText(text);
    if (!enforceMaxLength(sanitized, MAX_LEN)) {
      toast.error(`Comment cannot exceed ${MAX_LEN} characters`);
      return;
    }
    if (!canPerformAction('post-comment', 1500)) return;

    setSending(true);
    // Optimistic append
    const optimistic: CommentRow = {
      id: `opt-${Date.now()}`,
      moment_id: String(momentId),
      user_id: user.id,
      content: sanitized,
      created_at: new Date().toISOString(),
      author: profile
        ? { id: user.id, trail_name: (profile as any).trail_name ?? 'You', avatar_url: (profile as any).avatar_url ?? null }
        : { id: user.id, trail_name: 'You', avatar_url: null },
    };
    setComments(prev => [...prev, optimistic]);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ moment_id: momentId, user_id: user.id, content: sanitized })
        .select('*, author:profiles(id, trail_name, avatar_url)')
        .single();
      if (error) throw error;
      // Replace optimistic with real
      setComments(prev => prev.map(c => c.id === optimistic.id ? (data as any) : c));
    } catch (err) {
      console.error('post comment failed', err);
      toast.error('Comment failed to post');
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      setText(sanitized); // restore
    } finally {
      setSending(false);
    }
  };

  const renderComment = useCallback(({ item }: { item: CommentRow }) => {
    const ts = new Date(item.created_at);
    const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={styles.row}>
        <View style={styles.avatar}>
          {item.author?.avatar_url ? (
            <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={14} color={colors.ink3} />
          )}
        </View>
        <View style={styles.bubble}>
          <View style={styles.bubbleHead}>
            <Text style={styles.author}>{item.author?.trail_name ?? 'Wanderkind'}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.content}>{item.content}</Text>
        </View>
      </View>
    );
  }, []);

  const charsLeft = MAX_LEN - text.length;
  const overLimit = charsLeft < 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Comments</Text>
          <Text style={styles.headerSub}>{comments.length} reflection{comments.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.amber} /></View>
        ) : comments.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.ink3} />
            <Text style={styles.emptyTitle}>Be the first</Text>
            <Text style={styles.emptyBody}>What did this moment bring up for you?</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={c => c.id}
            renderItem={renderComment}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, overLimit && { borderColor: colors.red }]}
            placeholder="Add a comment…"
            placeholderTextColor={colors.ink3}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX_LEN + 50}
          />
          <View style={styles.inputRight}>
            <Text style={[styles.counter, overLimit && { color: colors.red }]}>{charsLeft}</Text>
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending || overLimit) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending || overLimit}
            >
              <Ionicons name="send" size={16} color={colors.amber} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink },
  headerSub: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl, gap: 6 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 8 },
  emptyBody: { ...typography.bodySm, color: colors.ink2, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing.md },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  bubble: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.borderLt,
  },
  bubbleHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  author: { ...typography.bodySm, fontWeight: '700', color: colors.ink },
  time: { fontSize: 10, color: colors.ink3 },
  content: { ...typography.bodySm, color: colors.ink, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink,
    maxHeight: 120, borderWidth: 1, borderColor: 'transparent',
  },
  inputRight: { alignItems: 'center', gap: 4 },
  counter: { fontSize: 10, color: colors.ink3, fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New' },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amberBg,
    justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
