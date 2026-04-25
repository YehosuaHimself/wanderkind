import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Moment, Profile } from '../../../src/types/database';
import { SEED_MOMENTS } from '../../../src/data/seed-moments';
import { SEED_STORIES } from '../../../src/data/seed-stories';
import { StoryRing } from '../../../src/components/stories/StoryRing';
import { StoryViewer } from '../../../src/components/stories/StoryViewer';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type MomentWithAuthor = Moment & { author?: Profile };

type StoryGroup = {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  stories: typeof SEED_STORIES;
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
  if (isLoading) return null;

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

    // Fallback to seed data if Supabase returns empty or fails
    setMoments(SEED_MOMENTS as unknown as MomentWithAuthor[]);
  }, []);

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

    // Fallback to seed stories
    const grouped = groupStoriesByAuthor(SEED_STORIES as any);
    setStoryGroups(grouped);
  }, []);

  const groupStoriesByAuthor = (stories: typeof SEED_STORIES): StoryGroup[] => {
    const map = new Map<string, StoryGroup>();
    for (const story of stories) {
      if (!map.has(story.author_id)) {
        map.set(story.author_id, {
          authorId: story.author_id,
          authorName: (story as any).author?.trail_name ?? 'Wanderkind',
          authorAvatar: (story as any).author?.avatar_url ?? null,
          stories: [],
        });
      }
      map.get(story.author_id)!.stories.push(story as any);
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    fetchMoments();
    fetchStories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMoments(), fetchStories()]);
    setRefreshing(false);
  };

  // Start a message thread with a moment's author
  const handleMessageAuthor = useCallback(async (authorId: string) => {
    if (!user) return;
    if (authorId === user.id) return;
    router.push(`/(tabs)/messages/new?userId=${authorId}`);
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
      <View style={styles.storyBar}>
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
      </View>
    );
  }, [storyGroups, profile, router]);

  // ── Filter tabs ────────────────────────────────────────────────────
  const renderFilterTabs = useCallback(() => (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'nearby' && styles.filterTabActive]}
        onPress={() => setFilter('nearby')}
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
        onPress={() => setFilter('recent')}
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
      {renderStoryBar()}
      {renderFilterTabs()}
    </View>
  ), [renderStoryBar, renderFilterTabs]);

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

            {/* Message button */}
            {user && item.author_id !== user.id && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessageAuthor(item.author_id)}
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
        </View>
      );
    },
    [user, handleMessageAuthor, filter, formatDistance]
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

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          stories={viewingStory.stories}
          authorName={viewingStory.authorName}
          authorAvatar={viewingStory.authorAvatar}
          visible={!!viewingStory}
          onClose={() => setViewingStory(null)}
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
  // Story bar
  storyBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
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
