import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type CommentWithAuthor = {
  id: string;
  moment_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
};

export default function CommentsList() {
  useAuthGuard();

  const router = useRouter();
  const { momentId } = useLocalSearchParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [momentId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('moment_comments')
        .select('*, author:profiles!moment_comments_author_id_fkey(*)')
        .eq('moment_id', momentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data || []) as CommentWithAuthor[]);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!user || !replyText.trim()) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('moment_comments')
        .insert({
          moment_id: momentId,
          author_id: user.id,
          content: replyText.trim(),
        })
        .select('*, author:profiles!moment_comments_author_id_fkey(*)')
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data as CommentWithAuthor]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setPosting(false);
    }
  };

  const renderComment = ({ item }: { item: CommentWithAuthor }) => (
    <View style={styles.commentCard}>
      <View style={styles.authorRow}>
        <TouchableOpacity style={styles.avatar}>
          {item.author?.avatar_url ? (
            <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={14} color={colors.ink3} />
          )}
        </TouchableOpacity>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author?.trail_name || 'Wanderkind'}</Text>
          <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.content}>{item.content}</Text>
      <TouchableOpacity style={styles.replyLink}>
        <Ionicons name="arrow-redo-outline" size={12} color={colors.amber} />
        <Text style={styles.replyLinkText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptyText}>Be the first to share your thoughts on this moment.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <Text style={styles.commentCount}>{comments.length}</Text>
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Reply Input */}
      <View style={styles.replySection}>
        <TextInput
          style={styles.replyInput}
          placeholder="Share your thought..."
          placeholderTextColor={colors.ink3}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          numberOfLines={1}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
          onPress={handleReply}
          disabled={posting || !replyText.trim()}
        >
          {posting ? (
            <ActivityIndicator size="small" color={colors.amber} />
          ) : (
            <Ionicons name="send" size={16} color={colors.amber} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink, flex: 1, textAlign: 'center' },
  headerSpacer: {},
  commentCount: { fontSize: 13, fontWeight: '600', color: colors.amber },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8, paddingBottom: 16 },
  commentCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  commentTime: { fontSize: 10, color: colors.ink3, marginTop: 2 },
  content: { ...typography.bodySm, color: colors.ink, marginBottom: 8, lineHeight: 19 },
  replyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyLinkText: { fontSize: 11, color: colors.amber, fontWeight: '500' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, marginTop: 6, textAlign: 'center' },
  replySection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
