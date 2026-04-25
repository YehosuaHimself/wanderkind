import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Moment, Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type MomentWithAuthor = Moment & { author?: Profile };

export default function MomentsFeed() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [moments, setMoments] = useState<MomentWithAuthor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMoments = useCallback(async () => {
    const { data } = await supabase
      .from('moments')
      .select('*, author:profiles!moments_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setMoments(data as MomentWithAuthor[]);
  }, []);

  useEffect(() => { fetchMoments(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoments();
    setRefreshing(false);
  };

  const renderMoment = ({ item }: { item: MomentWithAuthor }) => (
    <View style={styles.momentCard}>
      {/* Author row */}
      <TouchableOpacity
        style={styles.authorRow}
        onPress={() => router.push(`/(tabs)/me/profile/${item.author_id}`)}
      >
        <View style={styles.avatar}>
          {item.author?.avatar_url ? (
            <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={16} color={colors.ink3} />
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author?.trail_name ?? 'Wanderkind'}</Text>
          <Text style={styles.momentTime}>{formatTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Photo */}
      {item.photo_url && (
        <Image source={{ uri: item.photo_url }} style={styles.momentPhoto} resizeMode="cover" />
      )}

      {/* Content */}
      <Text style={styles.momentContent}>{item.content}</Text>

      {/* Location */}
      {item.location_name && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.ink3} />
          <Text style={styles.locationText}>{item.location_name}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Like, ${item.likes_count || 0} likes`} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart-outline" size={20} color={colors.ink3} />
          <Text style={styles.actionCount}>{item.likes_count || ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment, ${item.replies_count || 0} replies`} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.ink3} />
          <Text style={styles.actionCount}>{item.replies_count || ''}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="star-outline" size={48} color={colors.amberLine} />
      </View>
      <Text style={styles.emptyTitle}>No moments yet</Text>
      <Text style={styles.emptyText}>Share your first moment from the road.{'\n'}Photos, thoughts, a sunrise.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MOMENTS</Text>
        </View>
        <Text style={styles.headerTitle}>From the Road</Text>
      </View>

      <FlatList
        data={moments}
        renderItem={renderMoment}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Create Moment */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/moments/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  headerLabelText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  list: {
    paddingVertical: 8,
  },
  momentCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    paddingBottom: 10,
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
  avatarImage: { width: 32, height: 32 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  momentTime: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  momentPhoto: {
    width: '100%',
    height: 240,
    backgroundColor: colors.surfaceAlt,
  },
  momentContent: {
    ...typography.bodySm,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  locationText: { fontSize: 11, color: colors.ink3 },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 4,
  },
  actionCount: { fontSize: 12, color: colors.ink3, fontWeight: '500' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 48,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
