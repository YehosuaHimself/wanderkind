import React, { useState, useEffect, useCallback } from 'react';
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
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Moment, Profile } from '../../../src/types/database';

type MomentWithAuthor = Moment & { author?: Profile };
type CommentWithAuthor = {
  id: string;
  moment_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
};

export default function MomentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [moment, setMoment] = useState<MomentWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchMoment();
  }, [id]);

  const fetchMoment = useCallback(async () => {
    try {
      const { data: momentData } = await supabase
        .from('moments')
        .select('*, author:profiles!moments_author_id_fkey(*)')
        .eq('id', id)
        .single();

      if (momentData) {
        setMoment(momentData as MomentWithAuthor);
        setLikeCount(momentData.likes_count || 0);
      }

      // Fetch comments (using a hypothetical comment table)
      const { data: commentsData } = await supabase
        .from('moment_comments')
        .select('*, author:profiles!moment_comments_author_id_fkey(*)')
        .eq('moment_id', id)
        .order('created_at', { ascending: true });

      if (commentsData) {
        setComments(commentsData as CommentWithAuthor[]);
      }
    } catch (err) {
      console.error('Failed to fetch moment:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      setLiked(!liked);
      const newCount = liked ? likeCount - 1 : likeCount + 1;
      setLikeCount(newCount);

      // TODO: Store like in database
      await supabase
        .from('moments')
        .update({ likes_count: newCount })
        .eq('id', id);
    } catch (err) {
      console.error('Like failed:', err);
      setLiked(!liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
    }
  };

  const handleReply = async () => {
    if (!user || !replyText.trim()) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('moment_comments')
        .insert({
          moment_id: id,
          author_id: user.id,
          content: replyText.trim(),
        })
        .select('*, author:profiles!moment_comments_author_id_fkey(*)')
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data as CommentWithAuthor]);
        setReplyText('');

        // Increment comment count
        if (moment) {
          const newCount = (moment.replies_count || 0) + 1;
          await supabase
            .from('moments')
            .update({ replies_count: newCount })
            .eq('id', id);
          setMoment({ ...moment, replies_count: newCount });
        }
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!moment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={typography.bodySm}>Moment not found</Text>
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
        <Text style={styles.headerTitle}>Moment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={styles.commentAuthorRow}>
              <View style={styles.avatar}>
                {item.author?.avatar_url ? (
                  <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={14} color={colors.ink3} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthorName}>
                  {item.author?.trail_name || 'Wanderkind'}
                </Text>
                <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
              </View>
            </View>
            <Text style={styles.commentContent}>{item.content}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.momentSection}>
            {/* Author */}
            <TouchableOpacity style={styles.authorRow}>
              <View style={styles.avatar}>
                {moment.author?.avatar_url ? (
                  <Image source={{ uri: moment.author.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={16} color={colors.ink3} />
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{moment.author?.trail_name || 'Wanderkind'}</Text>
                <Text style={styles.momentTime}>{formatTime(moment.created_at)}</Text>
              </View>
            </TouchableOpacity>

            {/* Photo */}
            {moment.photo_url && (
              <Image
                source={{ uri: moment.photo_url }}
                style={styles.momentPhoto}
                resizeMode="cover"
              />
            )}

            {/* Content */}
            <Text style={styles.momentContent}>{moment.content}</Text>

            {/* Location */}
            {moment.location_name && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.ink3} />
                <Text style={styles.locationText}>{moment.location_name}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, liked && styles.actionBtnActive]}
                onPress={handleLike}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={liked ? colors.red : colors.ink3}
                />
                <Text style={[styles.actionCount, liked && { color: colors.red }]}>
                  {likeCount}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.ink3} />
                <Text style={styles.actionCount}>{comments.length}</Text>
              </View>
            </View>

            {/* Comments Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsHeaderText}>Comments</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Reply Input */}
      <View style={styles.replySection}>
        <TextInput
          style={styles.replyInput}
          placeholder="Add a comment..."
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
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8, paddingBottom: 16 },
  momentSection: { paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: 16 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  momentTime: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  momentPhoto: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    marginBottom: 12,
  },
  momentContent: {
    ...typography.body,
    color: colors.ink,
    marginBottom: 10,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: { fontSize: 11, color: colors.ink3 },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnActive: {},
  actionCount: { fontSize: 12, color: colors.ink3, fontWeight: '500' },
  commentsHeader: { marginTop: 16, marginBottom: 8 },
  commentsHeaderText: { ...typography.h3, color: colors.ink },
  commentCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  commentAuthorName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  commentTime: { fontSize: 10, color: colors.ink3, marginTop: 1 },
  commentContent: { ...typography.bodySm, color: colors.ink, lineHeight: 19 },
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
