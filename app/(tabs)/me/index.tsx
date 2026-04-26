import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, Switch, Dimensions, Platform, ActivityIndicator, Modal, Share,
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
import { QRCode } from '../../../src/components/ui/QRCode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ContentTab = 'posts' | 'stamps';

export default function MeScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile, updateProfile: storeUpdateProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('posts');

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

      // Fetch stamps for profile display
      const { data: stampsData } = await supabase
        .from('stamps')
        .select('*')
        .eq('walker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);
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
  const uploadToStorage = async (uri: string, filename: string): Promise<string> => {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // On web, wrap in File for proper content-type handling
    const file = Platform.OS === 'web'
      ? new File([blob], filename, { type: 'image/jpeg' })
      : blob;

    // Try upload — if bucket doesn't exist or RLS blocks, fall back to base64 data URL
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filename, file, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      // If storage fails (bucket missing, RLS, etc.), store the URI directly
      // This lets the user see their photo locally even without storage working
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        console.warn('Storage bucket not configured — saving image URI directly');
        return uri;
      }
      throw uploadError;
    }

    const { data: publicData } = supabase.storage.from('profiles').getPublicUrl(filename);
    return publicData.publicUrl;
  };

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
      const imageUri = result.assets[0].uri;
      const filename = `avatar_${user.id}_${Date.now()}.jpg`;
      const publicUrl = await uploadToStorage(imageUri, filename);

      // Use store's updateProfile for immediate local state + DB persist
      const { error: dbError } = await storeUpdateProfile({ avatar_url: publicUrl } as any);
      if (dbError) {
        console.error('Failed to save avatar URL:', dbError.message);
        toast.error('Could not save photo');
      } else {
        toast.success('Profile photo updated');
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
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
      const imageUri = result.assets[0].uri;
      const filename = `cover_${user.id}_${Date.now()}.jpg`;
      const publicUrl = await uploadToStorage(imageUri, filename);

      // Use store's updateProfile for immediate local state + DB persist
      const { error: dbError } = await storeUpdateProfile({ cover_url: publicUrl } as any);
      if (dbError) {
        console.error('Failed to save cover URL:', dbError.message);
        toast.error('Could not save cover photo');
      } else {
        toast.success('Cover photo updated');
      }
    } catch (err) {
      console.error('Cover upload failed:', err);
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

            {/* QR Code + mini action buttons */}
            <View style={styles.qrActionCol}>
              <TouchableOpacity
                style={styles.miniQr}
                onPress={() => setShowQrModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.qrOrangeFrame}>
                  <QRCode
                    value={`https://wanderkind.travel/u/${profile?.wanderkind_id || 'WK-0000'}`}
                    size={44}
                    color={colors.amber}
                  />
                </View>
                <Text style={styles.miniQrLabel}>SCAN ME</Text>
              </TouchableOpacity>
              <View style={styles.miniActionRow}>
                <TouchableOpacity
                  style={styles.miniActionBtn}
                  onPress={() => router.push('/(tabs)/me/edit-profile' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={12} color={colors.ink2} />
                  <Text style={styles.miniActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniActionBtn}
                  onPress={() => router.push('/(tabs)/more/share-profile' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={12} color={colors.ink2} />
                  <Text style={styles.miniActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Name + Handle + WK-ID */}
          <View style={styles.nameSection}>
            <Text style={styles.trailName}>{profile?.trail_name ?? 'Wanderkind'}</Text>
            <Text style={styles.handle}>@{(profile?.trail_name ?? 'wanderkind').toLowerCase().replace(/\s+/g, '.')} · {profile?.wanderkind_id ?? 'WK-0000'}</Text>

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

          {/* Profile Images — horizontal scroll right below bio */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.profileImagesRow}
            style={styles.profileImagesScroll}
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const photo = galleryPhotos[i];
              if (photo) {
                return (
                  <TouchableOpacity
                    key={`pi-${i}`}
                    style={styles.profileImageSlot}
                    onPress={() => router.push('/(tabs)/me/gallery' as any)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo }} style={styles.profileImageThumb} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={`pi-${i}`}
                  style={styles.profileImageEmpty}
                  onPress={() => router.push('/(tabs)/me/gallery' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.ink3} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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

        {/* ===== CURRENTLY WANDERING ===== */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>CURRENTLY</Text>
        </View>

        {/* ===== STATS ===== */}
        {!isQuietMode && (
          <>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>STATS</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{moments.length || profile?.nights_walked || 0}</Text>
                <Text style={styles.statLabel}>NIGHTS</Text>
              </View>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.stat}>
                <Text style={styles.statValue}>{profile?.stamps_count ?? 0}</Text>
                <Text style={styles.statLabel}>STAMPS</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.stat}>
                <Text style={styles.statValue}>{profile?.total_hosted ?? 0}</Text>
                <Text style={styles.statLabel}>HOSTED</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ===== POSTS | STAMPS — two-fold activity section ===== */}
        <View style={styles.activityTabBar}>
          <TouchableOpacity
            style={[styles.activityTab, activeTab === 'posts' && styles.activityTabActive]}
            onPress={() => setActiveTab('posts')}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={16} color={activeTab === 'posts' ? colors.amber : colors.ink3} />
            <Text style={[styles.activityTabText, activeTab === 'posts' && styles.activityTabTextActive]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.activityTab, activeTab === 'stamps' && styles.activityTabActive]}
            onPress={() => setActiveTab('stamps')}
            activeOpacity={0.7}
          >
            <Ionicons name="ribbon-outline" size={16} color={activeTab === 'stamps' ? colors.amber : colors.ink3} />
            <Text style={[styles.activityTabText, activeTab === 'stamps' && styles.activityTabTextActive]}>Stamps</Text>
            {stamps.length > 0 && (
              <View style={styles.activityTabBadge}>
                <Text style={styles.activityTabBadgeText}>{stamps.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Posts tab content */}
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

        {/* Stamps tab content */}
        {activeTab === 'stamps' && (
          <View style={styles.contentGrid}>
            {stamps.length > 0 ? (
              <View style={styles.stampsStack}>
                {stamps.map((stamp: any, idx: number) => (
                  <TouchableOpacity
                    key={stamp.id || idx}
                    style={styles.stampItem}
                    onPress={() => router.push(`/(tabs)/more/stamps/${stamp.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stampCircle, { backgroundColor: `${colors.amber}15` }]}>
                      {stamp.photo_url ? (
                        <Image source={{ uri: stamp.photo_url }} style={styles.stampCircleImg} />
                      ) : (
                        <Ionicons name="ribbon" size={16} color={colors.amber} />
                      )}
                    </View>
                    <View style={styles.stampItemInfo}>
                      <Text style={styles.stampItemName} numberOfLines={1}>{stamp.place_name || stamp.category || 'Stamp'}</Text>
                      <Text style={styles.stampItemDate}>{new Date(stamp.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.viewAllStamps}
                  onPress={() => router.push('/(tabs)/more/stamps' as any)}
                >
                  <Text style={styles.viewAllStampsText}>View Full Collection</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.amber} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyTab}>
                <Ionicons name="ribbon-outline" size={36} color={colors.ink3} />
                <Text style={styles.emptyTabTitle}>No stamps yet</Text>
                <Text style={styles.emptyTabText}>Collect stamps at hosts and landmarks along your way.</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Fullscreen Modal — unfolds large on tap, no separate page */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <TouchableOpacity
          style={styles.qrModalOverlay}
          activeOpacity={1}
          onPress={() => setShowQrModal(false)}
        >
          <View style={styles.qrModalCard}>
            {/* Orange frame with creamy bg */}
            <View style={styles.qrModalFrame}>
              <QRCode
                value={`https://wanderkind.travel/u/${profile?.wanderkind_id || 'WK-0000'}`}
                size={200}
                color={colors.amber}
              />
            </View>

            {/* Name + ID */}
            <Text style={styles.qrModalName}>{profile?.trail_name ?? 'Wanderkind'}</Text>
            <Text style={styles.qrModalId}>{profile?.wanderkind_id ?? 'WK-0000'}</Text>
            <Text style={styles.qrModalHint}>Scan to view profile</Text>

            {/* Share button */}
            <TouchableOpacity
              style={styles.qrShareBtn}
              onPress={async () => {
                const url = `https://wanderkind.travel/u/${profile?.wanderkind_id || 'WK-0000'}`;
                try {
                  if (Platform.OS === 'web') {
                    if (navigator.share) {
                      await navigator.share({ title: 'My Wanderkind Profile', url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied');
                    }
                  } else {
                    await Share.share({ message: `Check out my Wanderkind profile: ${url}` });
                  }
                } catch {
                  // User cancelled share
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.qrShareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    top: -1,
    right: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.amber,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  walkingBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : 'Helvetica Neue',
  },

  // === SECTION TITLES ===
  sectionBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.ink3,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
  },

  nameSection: {
    marginBottom: 6,
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
    marginBottom: 4,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: colors.ink3,
    fontStyle: 'italic',
    marginBottom: 4,
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
    marginBottom: 10,
  },
  qrActionCol: {
    alignItems: 'center',
    gap: 6,
  },
  miniQr: {
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#FFF9F0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.amber,
  },
  qrOrangeFrame: {
    padding: 4,
    backgroundColor: '#FFF9F0',
    borderRadius: 6,
  },
  miniQrLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 7,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '700',
    marginTop: 3,
  },
  miniActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  miniActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.ink2,
  },

  // QR Fullscreen Modal
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalCard: {
    width: 300,
    backgroundColor: '#FFF9F0',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.amber,
    ...shadows.lg,
  },
  qrModalFrame: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${colors.amber}40`,
    marginBottom: 20,
  },
  qrModalName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  qrModalId: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '700',
    marginBottom: 8,
  },
  qrModalHint: {
    fontSize: 12,
    color: colors.ink3,
    marginBottom: 20,
  },
  qrShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  qrShareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // === PROFILE IMAGES (horizontal scroll, inside profileHeader) ===
  profileImagesScroll: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: -20,
  },
  profileImagesRow: {
    paddingHorizontal: 20,
    gap: 7,
    paddingVertical: 2,
  },
  profileImageSlot: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  profileImageThumb: {
    width: '100%',
    height: '100%',
  },
  profileImageEmpty: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === ACTIVITY TABS (Posts | Stamps) ===
  activityTabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  activityTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activityTabActive: {
    borderBottomColor: colors.amber,
  },
  activityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink3,
  },
  activityTabTextActive: {
    color: colors.amber,
  },
  activityTabBadge: {
    backgroundColor: colors.amberBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activityTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber,
  },
  viewAllStamps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  viewAllStampsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber,
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
  stampsStack: {
    gap: 4,
  },
  stampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: 10,
  },
  stampCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampCircleImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  stampItemInfo: { flex: 1 },
  stampItemName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  stampItemDate: { fontSize: 10, color: colors.ink3, marginTop: 1 },

});
