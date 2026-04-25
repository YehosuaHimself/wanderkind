import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, Switch, FlatList, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, shadows, tierColors } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { showAlert } from '../../../src/lib/alert';
import { SEED_MOMENTS } from '../../../src/data/seed-moments';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_SIZE = (SCREEN_WIDTH - 48 - 36) / 7; // 7 items with 6 gaps of 6px

type ContentTab = 'posts' | 'stamps';

export default function MeScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('posts');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setIsWalking(profile.is_walking ?? false);
    }
  }, [profile]);

  useEffect(() => {
    fetchContent();
  }, [user?.id]);

  const fetchContent = async () => {
    if (!user) return;
    try {
      // Fetch user's moments
      const { data: momentsData } = await supabase
        .from('moments')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMoments(momentsData || []);

      // Fetch user's stamps
      const { data: stampsData } = await supabase
        .from('stamps')
        .select('*')
        .eq('walker_id', user.id)
        .order('date', { ascending: false })
        .limit(20);
      setStamps(stampsData || []);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      toast.error('Could not load your content');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    await fetchContent();
    setRefreshing(false);
  };

  const toggleWalking = async (value: boolean) => {
    const prev = isWalking;
    setIsWalking(value);
    if (user) {
      const { error } = await supabase.from('profiles').update({ is_walking: value } as any).eq('id', user.id);
      if (error) { setIsWalking(prev); showAlert('Error', error.message); }
    }
  };

  // === PHOTO UPLOAD HANDLERS ===
  const pickAndUploadAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0] || !user) return;

      setUploadingAvatar(true);
      let blob;
      try {
        const response = await fetch(result.assets[0].uri);
        blob = await response.blob();
      } catch (err) {
        console.error('Failed to fetch photo:', err);
        throw err;
      }
      const filename = `avatar_${user.id}_${Date.now()}.jpg`;
      const file = Platform.OS === 'web'
        ? new File([blob], filename, { type: 'image/jpeg' })
        : blob;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filename, file, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('profiles').getPublicUrl(filename);
      await supabase.from('profiles').update({ avatar_url: publicData.publicUrl } as any).eq('id', user.id);
      await fetchProfile();
    } catch (err) {
      showAlert('Upload failed', err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const pickAndUploadCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0] || !user) return;

      setUploadingCover(true);
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const filename = `cover_${user.id}_${Date.now()}.jpg`;
      const file = Platform.OS === 'web'
        ? new File([blob], filename, { type: 'image/jpeg' })
        : blob;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filename, file, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('profiles').getPublicUrl(filename);
      await supabase.from('profiles').update({ cover_url: publicData.publicUrl } as any).eq('id', user.id);
      await fetchProfile();
    } catch (err) {
      showAlert('Upload failed', err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const tierColor = tierColors[profile?.tier ?? 'wanderkind'] ?? colors.ink3;
  const isQuietMode = profile?.quiet_mode ?? false;
  const galleryPhotos: string[] = profile?.gallery_urls || profile?.gallery || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
      >
        {/* ===== COVER PHOTO ===== */}
        <TouchableOpacity
          style={styles.coverContainer}
          onPress={pickAndUploadCover}
          activeOpacity={0.85}
        >
          {profile?.cover_url ? (
            <Image source={{ uri: profile.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="camera-outline" size={20} color={colors.ink3} />
              <Text style={styles.coverPlaceholderText}>ADD COVER</Text>
            </View>
          )}
          {uploadingCover && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          {/* Camera icon overlay */}
          {profile?.cover_url && (
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* ===== AVATAR + QR + INFO ===== */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarQrRow}>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={pickAndUploadAvatar}
              activeOpacity={0.85}
            >
              <View style={styles.avatarBorder}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={36} color={colors.ink3} />
                  </View>
                )}
              </View>
              <View style={styles.avatarCameraBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={12} color="#fff" />
                )}
              </View>
              {/* Walking W badge */}
              {isWalking && (
                <View style={styles.walkingBadge}>
                  <Text style={styles.walkingBadgeText}>W</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Mini QR Code — always visible and scannable */}
            <TouchableOpacity
              style={styles.miniQr}
              onPress={() => router.push('/(tabs)/me/qr-code' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={36} color={colors.ink} />
              <Text style={styles.miniQrLabel}>SCAN ME</Text>
            </TouchableOpacity>
          </View>

          {/* Name + Bio */}
          <View style={styles.nameSection}>
            <Text style={styles.trailName}>{profile?.trail_name ?? 'Wanderkind'}</Text>
            <Text style={styles.handle}>@{profile?.trail_name?.replace(/^@/, '') ?? 'wanderkind'}</Text>

            {!isQuietMode && (
              <View style={[styles.tierBadge, { backgroundColor: `${tierColor}15` }]}>
                <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {(profile?.tier ?? 'wanderkind').toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => router.push('/(tabs)/me/edit-profile' as any)}>
              <Text style={styles.bioPlaceholder}>Add a bio to let others know your story...</Text>
            </TouchableOpacity>
          )}

          {/* Walking toggle */}
          <View style={styles.walkingToggle}>
            <View style={styles.walkingToggleInfo}>
              <Ionicons name="walk-outline" size={16} color={isWalking ? colors.amber : colors.ink3} />
              <Text style={[styles.walkingToggleText, isWalking && { color: colors.amber }]}>
                {isWalking ? 'Currently Wandering' : 'Resting'}
              </Text>
            </View>
            <Switch
              value={isWalking}
              onValueChange={toggleWalking}
              trackColor={{ false: colors.border, true: colors.amberBg }}
              thumbColor={isWalking ? colors.amber : colors.ink3}
            />
          </View>
        </View>

        {/* ===== STATS ROW ===== */}
        {!isQuietMode && (
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} onPress={() => setActiveTab('posts')}>
              <Text style={styles.statValue}>{moments.length || profile?.nights_walked || 0}</Text>
              <Text style={styles.statLabel}>NIGHTS</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat} onPress={() => setActiveTab('stamps')}>
              <Text style={styles.statValue}>{stamps.length || profile?.stamps_count || 0}</Text>
              <Text style={styles.statLabel}>STAMPS</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statValue}>{profile?.total_hosted ?? 0}</Text>
              <Text style={styles.statLabel}>HOSTED</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/me/edit-profile' as any)}
          >
            <Ionicons name="create-outline" size={16} color={colors.ink} />
            <Text style={styles.actionBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/more/share-profile' as any)}
          >
            <Ionicons name="share-outline" size={16} color={colors.ink} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ===== SWIPEABLE IMAGE CAROUSEL (up to 7 photos) ===== */}
        {(galleryPhotos.length > 0) ? (
          <View style={styles.carouselSection}>
            <FlatList
              data={galleryPhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `gallery-${i}`}
              renderItem={({ item }) => (
                <View style={styles.carouselSlide}>
                  <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
                </View>
              )}
            />
            <View style={styles.carouselDots}>
              {galleryPhotos.map((_, i) => (
                <View key={i} style={styles.carouselDot} />
              ))}
            </View>
            {/* Add more photos indicator */}
            {galleryPhotos.length < 7 && (
              <TouchableOpacity
                style={styles.addPhotoOverlay}
                onPress={() => router.push('/(tabs)/me/gallery' as any)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addPhotoText}>{galleryPhotos.length}/7</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.carouselEmpty}
            onPress={() => router.push('/(tabs)/me/gallery' as any)}
          >
            <Ionicons name="images-outline" size={28} color={colors.ink3} />
            <Text style={styles.carouselEmptyText}>Add up to 7 journey photos</Text>
          </TouchableOpacity>
        )}

        {/* ===== PASSES QUICK ACCESS ===== */}
        <TouchableOpacity
          style={styles.passesRow}
          onPress={() => router.push('/(tabs)/me/passes' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.passesIcon}>
            <Ionicons name="document-text" size={16} color={colors.amber} />
          </View>
          <Text style={styles.passesText}>Your Passes</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* ===== CONTENT TABS ===== */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === 'posts' ? colors.amber : colors.ink3}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stamps' && styles.tabActive]}
            onPress={() => setActiveTab('stamps')}
          >
            <Ionicons
              name="star-outline"
              size={20}
              color={activeTab === 'stamps' ? colors.amber : colors.ink3}
            />
          </TouchableOpacity>
        </View>

        {/* ===== TAB CONTENT ===== */}
        {activeTab === 'posts' && (
          <View style={styles.contentGrid}>
            {moments.length > 0 ? (
              <View style={styles.photoGrid}>
                {moments.map((m, idx) => (
                  <TouchableOpacity
                    key={m.id || idx}
                    style={styles.gridItem}
                    onPress={() => router.push(`/(tabs)/moments` as any)}
                  >
                    {m.photo_url ? (
                      <Image source={{ uri: m.photo_url }} style={styles.gridImage} />
                    ) : (
                      <View style={styles.gridTextItem}>
                        <Text style={styles.gridText} numberOfLines={4}>{m.content}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTab}>
                <Ionicons name="camera-outline" size={36} color={colors.ink3} />
                <Text style={styles.emptyTabTitle}>No posts yet</Text>
                <Text style={styles.emptyTabText}>Share your first moment from the road.</Text>
                <TouchableOpacity
                  style={styles.emptyTabAction}
                  onPress={() => router.push('/(tabs)/moments/create' as any)}
                >
                  <Text style={styles.emptyTabActionText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stamps' && (
          <View style={styles.contentGrid}>
            {stamps.length > 0 ? (
              <View style={styles.stampsList}>
                {stamps.map((s, idx) => (
                  <TouchableOpacity
                    key={s.id || idx}
                    style={styles.stampItem}
                    onPress={() => router.push(`/(tabs)/me/stamp/${s.id}` as any)}
                  >
                    <View style={styles.stampCircle}>
                      <Ionicons name="star" size={16} color={colors.amber} />
                    </View>
                    <View style={styles.stampInfo}>
                      <Text style={styles.stampName}>{s.host_name || s.location || 'Stamp'}</Text>
                      <Text style={styles.stampDate}>{s.date || ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTab}>
                <Ionicons name="star-outline" size={36} color={colors.ink3} />
                <Text style={styles.emptyTabTitle}>No stamps yet</Text>
                <Text style={styles.emptyTabText}>Collect stamps at hosts along the way.</Text>
              </View>
            )}
          </View>
        )}


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // === COVER ===
  coverContainer: {
    height: 180,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  coverPlaceholderText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === PROFILE HEADER ===
  profileHeader: {
    paddingHorizontal: 20,
    marginTop: -44,
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  avatarBorder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.bg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.amber,
    borderWidth: 2,
    borderColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
  },

  nameSection: {
    marginBottom: 8,
  },
  trailName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 28,
  },
  handle: {
    fontSize: 13,
    color: colors.ink3,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
    marginBottom: 12,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: colors.ink3,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  walkingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  walkingToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walkingToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink2,
  },

  // === STATS ===
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink3,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLt,
  },

  // === AVATAR + QR ROW ===
  avatarQrRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniQr: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  miniQrLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 7,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
    marginTop: 4,
  },

  // === ACTION BUTTONS ===
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },

  // === IMAGE CAROUSEL ===
  carouselSection: {
    height: 260,
    position: 'relative',
    marginBottom: 4,
  },
  carouselSlide: {
    width: SCREEN_WIDTH,
    height: 260,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  addPhotoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addPhotoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  carouselEmpty: {
    height: 120,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
  },
  carouselEmptyText: {
    fontSize: 13,
    color: colors.ink3,
  },

  // === PASSES ROW ===
  passesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.amberLine,
  },
  passesIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.amber,
  },

  // === TAB BAR ===
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.amber,
  },

  // === CONTENT GRID ===
  contentGrid: {
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 200,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 44) / 3,
    height: (SCREEN_WIDTH - 44) / 3,
    backgroundColor: colors.surfaceAlt,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridTextItem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  gridText: {
    fontSize: 11,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  emptyTabText: {
    fontSize: 13,
    color: colors.ink3,
    textAlign: 'center',
  },
  emptyTabAction: {
    marginTop: 12,
    backgroundColor: colors.amber,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyTabActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // === STAMPS LIST ===
  stampsList: {
    gap: 8,
  },
  stampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  stampCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampInfo: { flex: 1 },
  stampName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  stampDate: { fontSize: 11, color: colors.ink3, marginTop: 2 },

});
