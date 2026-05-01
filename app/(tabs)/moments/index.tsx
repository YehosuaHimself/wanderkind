import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Modal, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { supabase } from '../../../src/lib/supabase';
import { Moment, Profile } from '../../../src/types/database';
import { StoryRing } from '../../../src/components/stories/StoryRing';
import { StoryViewer } from '../../../src/components/stories/StoryViewer';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';
import { SEED_MOMENTS } from '../../../src/data/seed-moments';
import { SEED_STORIES } from '../../../src/data/seed-stories';

type MomentWithAuthor = Moment & { author?: Profile };

type StoryGroup = {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  stories: any[];
};

type FeedFilter = 'nearby' | 'recent';

// ── Haversine distance (km) ──────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MomentsFeed() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const { profile } = useAuth();
  const [moments, setMoments] = useState<MomentWithAuthor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('nearby');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Stories state
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewingStory, setViewingStory] = useState<StoryGroup | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // ── Get user location ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setUserLat(pos.coords.latitude);
                setUserLng(pos.coords.longitude);
              },
              () => {
                // Permission denied or error — fall back to profile location
                if (profile?.lat && profile?.lng) {
                  setUserLat(profile.lat);
                  setUserLng(profile.lng);
                }
              },
              { enableHighAccuracy: false, timeout: 8000 }
            );
          }
        } else {
          // Native: use expo-location
          try {
            const Location = require('expo-location');
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setUserLat(loc.coords.latitude);
              setUserLng(loc.coords.longitude);
            } else if (profile?.lat && profile?.lng) {
              setUserLat(profile.lat);
              setUserLng(profile.lng);
            }
          } catch {
            if (profile?.lat && profile?.lng) {
              setUserLat(profile.lat);
              setUserLng(profile.lng);
            }
          }
        }
      } catch {
        // Silent fallback
        if (profile?.lat && profile?.lng) {
          setUserLat(profile.lat);
          setUserLng(profile.lng);
        }
      }
    })();
  }, [profile]);

  // ── Sort moments by proximity or recency ───────────────────────────
  const sortedMoments = useMemo(() => {
    if (filter === 'recent') {
      return [...moments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // Nearby: sort by distance (moments without coords go to the end)
    if (userLat == null || userLng == null) {
      // No user location — fall back to recent
      return [...moments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return [...moments].sort((a, b) => {
      const aHas = a.lat != null && a.lng != null;
      const bHas = b.lat != null && b.lng != null;
      if (!aHas && !bHas) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (!aHas) return 1;
      if (!bHas) return -1;
      const distA = haversineKm(userLat, userLng, a.lat!, a.lng!);
      const distB = haversineKm(userLat, userLng, b.lat!, b.lng!);
      return distA - distB;
    });
  }, [moments, filter, userLat, userLng]);

  const fetchMoments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*, author:profiles!moments_author_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setMoments(data as MomentWithAuthor[]);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch moments:', err);
    }

    // DB returned 0 moments — fall back to seed data so the feed never feels empty
    setMoments(SEED_MOMENTS.slice(0, 30) as unknown as MomentWithAuthor[]);
  }, []);

  const fetchLikes = useCallback(async (momentIds: string[]) => {
    if (!momentIds.length) return;
    try {
      // Counts per moment
      const { data: rows } = await supabase
        .from('moment_likes')
        .select('moment_id, user_id')
        .in('moment_id', momentIds);
      const counts: Record<string, number> = {};
      const myLikes = new Set<string>();
      for (const r of (rows as any[]) || []) {
        counts[r.moment_id] = (counts[r.moment_id] || 0) + 1;
        if (user && r.user_id === user.id) myLikes.add(r.moment_id);
      }
      setLikeCounts(counts);
      setLikedIds(myLikes);
    } catch (err) {
      // best-effort — ignore
    }
  }, [user]);

  const toggleLike = useCallback(async (momentId: string) => {
    if (!user) return;
    const isLiked = likedIds.has(momentId);
    // Optimistic flip
    setLikedIds(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(momentId); else next.add(momentId);
      return next;
    });
    setLikeCounts(prev => ({
      ...prev,
      [momentId]: Math.max(0, (prev[momentId] || 0) + (isLiked ? -1 : 1)),
    }));
    try {
      if (isLiked) {
        await supabase.from('moment_likes').delete().eq('moment_id', momentId).eq('user_id', user.id);
      } else {
        await supabase.from('moment_likes').insert({ moment_id: momentId, user_id: user.id });
      }
    } catch (err) {
      // Rollback
      setLikedIds(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(momentId); else next.delete(momentId);
        return next;
      });
      setLikeCounts(prev => ({
        ...prev,
        [momentId]: Math.max(0, (prev[momentId] || 0) + (isLiked ? 1 : -1)),
      }));
    }
  }, [user, likedIds]);


  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Group by author
        const grouped = groupStoriesByAuthor(data as any);
        setStoryGroups(grouped);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }

    // DB returned 0 stories — inject seed stories with refreshed timestamps
    const now = Date.now();
    const refreshed = SEED_STORIES.map((s, i) => ({
      ...s,
      created_at: new Date(now - i * 20 * 60 * 1000).toISOString(),       // 20 min apart, newest first
      expires_at: new Date(now + (11 * 60 + 11) * 60 * 1000).toISOString(), // 11h11m from now
    }));
    const grouped = groupStoriesByAuthor(refreshed as any);
    setStoryGroups(grouped);
  }, []);

  const groupStoriesByAuthor = useCallback((stories: any[]): StoryGroup[] => {
    const map = new Map<string, StoryGroup & { lat?: number | null; lng?: number | null }>();
    for (const story of stories) {
      if (!map.has(story.author_id)) {
        map.set(story.author_id, {
          authorId: story.author_id,
          authorName: (story as any).author?.trail_name ?? 'Wanderkind',
          authorAvatar: (story as any).author?.avatar_url ?? null,
          stories: [],
          lat: story.lat,
          lng: story.lng,
        });
      }
      map.get(story.author_id)!.stories.push(story as any);
    }
    const groups = Array.from(map.values());

    // Sort by proximity if user location is available
    if (userLat != null && userLng != null) {
      groups.sort((a, b) => {
        const aHas = a.lat != null && a.lng != null;
        const bHas = b.lat != null && b.lng != null;
        if (!aHas && !bHas) return 0;
        if (!aHas) return 1;
        if (!bHas) return -1;
        return haversineKm(userLat, userLng, a.lat!, a.lng!) - haversineKm(userLat, userLng, b.lat!, b.lng!);
      });
    }

    return groups;
  }, [userLat, userLng]);

  useEffect(() => {
    fetchMoments();
    fetchStories();
  }, [fetchMoments, fetchStories]);

  // After moments load, hydrate like counts + my likes
  useEffect(() => {
    if (moments.length > 0) {
      fetchLikes(moments.map(m => m.id));
    }
  }, [moments, fetchLikes]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptic.medium();
    await Promise.all([fetchMoments(), fetchStories()]);
    setRefreshing(false);
  };

  // Start a message thread with a moment's author — direct DM
  const handleMessageAuthor = useCallback(async (authorId: string, authorName?: string) => {
    if (!user) return;
    if (authorId === user.id) return;
    const params = new URLSearchParams({ userId: authorId });
    if (authorName) params.set('name', authorName);
    router.push(`/(tabs)/messages/new?${params.toString()}` as any);
  }, [user, router]);

  // ── Format distance for display ────────────────────────────────────
  const formatDistance = useCallback(
    (lat: number | null, lng: number | null): string | null => {
      if (lat == null || lng == null || userLat == null || userLng == null) return null;
      const km = haversineKm(userLat, userLng, lat, lng);
      if (km < 1) return `${Math.round(km * 1000)}m away`;
      if (km < 100) return `${Math.round(km)}km away`;
      return `${Math.round(km)}km`;
    },
    [userLat, userLng]
  );

  const renderStoryBar = useCallback(() => {
    if (storyGroups.length === 0) return null;

    return (
      <View style={styles.storyBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyBar}
        >
          {/* Your story */}
          <StoryRing
            imageUri={profile?.avatar_url}
            name="Your story"
            size={64}
            isAdd
            onPress={() => router.push('/(tabs)/moments/create-story')}
          />
          {/* Other users' stories */}
          {storyGroups.map(group => (
            <StoryRing
              key={group.authorId}
              imageUri={group.authorAvatar}
              name={group.authorName}
              size={64}
              hasUnseenStories
              onPress={() => setViewingStory(group)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }, [storyGroups, profile, router]);

  // ── Filter tabs ────────────────────────────────────────────────────
  const renderFilterTabs = useCallback(() => (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'nearby' && styles.filterTabActive]}
        onPress={() => { haptic.selection(); setFilter('nearby'); }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="location-outline"
          size={14}
          color={filter === 'nearby' ? colors.amber : colors.ink3}
        />
        <Text style={[styles.filterTabText, filter === 'nearby' && styles.filterTabTextActive]}>
          Nearby
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'recent' && styles.filterTabActive]}
        onPress={() => { haptic.selection(); setFilter('recent'); }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time-outline"
          size={14}
          color={filter === 'recent' ? colors.amber : colors.ink3}
        />
        <Text style={[styles.filterTabText, filter === 'recent' && styles.filterTabTextActive]}>
          Recent
        </Text>
      </TouchableOpacity>
    </View>
  ), [filter]);

  const renderListHeader = useCallback(() => (
    <View>
      {renderFilterTabs()}
    </View>
  ), [renderFilterTabs]);

  const renderMoment = useCallback(
    ({ item }: { item: MomentWithAuthor }) => {
      const dist = filter === 'nearby' ? formatDistance(item.lat, item.lng) : null;

      return (
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
              <View style={styles.metaRow}>
                <Text style={styles.momentTime}>{formatTime(item.created_at)}</Text>
                {dist && (
                  <>
                    <View style={styles.metaDot} />
                    <Text style={styles.distanceText}>{dist}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Message button — direct DM */}
            {user && item.author_id !== user.id && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessageAuthor(item.author_id, item.author?.trail_name)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.amber} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Photo */}
          {item.photo_url && (
            <TouchableOpacity onPress={() => setSelectedImage(item.photo_url)}>
              <Image source={{ uri: item.photo_url }} style={styles.momentPhoto} resizeMode="cover" />
            </TouchableOpacity>
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

          {/* Like + comments toolbar — WK-110 / WK-111 */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleLike(item.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={likedIds.has(item.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={likedIds.has(item.id) ? colors.red : colors.ink3}
              />
            </TouchableOpacity>
            {(likeCounts[item.id] || 0) > 0 ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(tabs)/moments/likes', params: { momentId: item.id } } as any)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionCount}>{likeCounts[item.id]}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 'auto' }]}
              onPress={() => router.push({ pathname: '/(tabs)/moments/comments', params: { momentId: item.id } } as any)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.ink3} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [user, handleMessageAuthor, filter, formatDistance, likedIds, likeCounts, toggleLike, router]
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

  if (isLoading) return null;

  return (
    <RouteErrorBoundary routeName="Moments">
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MEMORIES</Text>
        </View>
        <Text style={styles.headerTitle}>From the Road</Text>
      </View>

      {/* Sticky Stories Bar */}
      {renderStoryBar()}

      <FlatList
        data={sortedMoments}
        renderItem={renderMoment}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        initialNumToRender={10}
      />

      {/* FAB - Create Moment */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/moments/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Story Viewer Modal — with group navigation (swipe between users) */}
      {viewingStory && (
        <StoryViewer
          stories={viewingStory.stories}
          authorName={viewingStory.authorName}
          authorAvatar={viewingStory.authorAvatar}
          authorId={viewingStory.authorId}
          visible={!!viewingStory}
          onClose={() => setViewingStory(null)}
          onNextGroup={() => {
            const idx = storyGroups.findIndex(g => g.authorId === viewingStory.authorId);
            if (idx >= 0 && idx < storyGroups.length - 1) {
              setViewingStory(storyGroups[idx + 1]);
            } else {
              setViewingStory(null); // end of all groups
            }
          }}
          onPreviousGroup={() => {
            const idx = storyGroups.findIndex(g => g.authorId === viewingStory.authorId);
            if (idx > 0) {
              setViewingStory(storyGroups[idx - 1]);
            }
          }}
        />
      )}

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <Image
            source={{ uri: selectedImage || '' }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    </RouteErrorBoundary>
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
  actionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0E8D5',
  },
  actionBtn: { padding: 4 },
  actionCount: { fontSize: 12, fontWeight: '600', color: '#5C5147', paddingHorizontal: 4 },
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
  // Story bar
  storyBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  storyBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: 16,
  },
  // Filter tabs
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  filterTabActive: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amberLine,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink3,
  },
  filterTabTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 0,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  momentTime: { fontSize: 11, color: colors.ink3 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.ink3,
  },
  distanceText: {
    fontSize: 11,
    color: colors.amber,
    fontWeight: '500',
  },
  // Message button on each post
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
