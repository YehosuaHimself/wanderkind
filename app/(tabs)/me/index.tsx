import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

export default function MeScreen() {
  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [isHosting, setIsHosting] = useState(true);

  useEffect(() => {
    if (profile) {
      setIsWalking(profile.is_walking ?? false);
      setIsHosting(profile.is_available ?? true);
    }
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const toggleWalking = async (value: boolean) => {
    setIsWalking(value);
    if (user) {
      await supabase.from('profiles').update({ is_walking: value }).eq('id', user.id);
    }
  };

  const toggleHosting = async (value: boolean) => {
    setIsHosting(value);
    if (user) {
      await supabase.from('profiles').update({ is_available: value }).eq('id', user.id);
    }
  };

  const tierColor = tierColors[profile?.tier ?? 'wanderkind'] ?? colors.ink3;
  const isQuietMode = (profile as any)?.quiet_mode ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
      >
        {/* Cover Image */}
        <TouchableOpacity
          style={styles.coverContainer}
          onPress={() => router.push('/(tabs)/me/edit-cover' as any)}
          activeOpacity={0.9}
        >
          {profile?.cover_url ? (
            <Image source={{ uri: profile.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={24} color={colors.ink3} />
              <Text style={styles.coverPlaceholderText}>CHANGE COVER</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => router.push('/(tabs)/me/edit-profile' as any)}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={colors.ink3} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.trailName}>{profile?.trail_name ?? 'Wanderkind'}</Text>

          {/* Tier badge — hidden in Quiet Mode */}
          {!isQuietMode && (
            <View style={[styles.tierBadge, { backgroundColor: `${tierColor}15` }]}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
              <Text style={[styles.tierText, { color: tierColor }]}>
                {(profile?.tier ?? 'wanderkind').toUpperCase()}
              </Text>
            </View>
          )}

          {/* Stats — hidden in Quiet Mode */}
          {!isQuietMode && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile?.nights_walked ?? 0}</Text>
                <Text style={styles.statLabel}>NIGHTS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile?.stamps_count ?? 0}</Text>
                <Text style={styles.statLabel}>STAMPS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile?.total_hosted ?? 0}</Text>
                <Text style={styles.statLabel}>HOSTED</Text>
              </View>
            </View>
          )}
        </View>

        {/* Walking / Hosting toggles */}
        <View style={styles.togglesSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="walk-outline" size={18} color={colors.amber} />
              <Text style={styles.toggleLabel}>Currently Walking</Text>
            </View>
            <Switch
              value={isWalking}
              onValueChange={toggleWalking}
              trackColor={{ false: colors.border, true: colors.amberBg }}
              thumbColor={isWalking ? colors.amber : colors.ink3}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="home-outline" size={18} color={colors.green} />
              <Text style={styles.toggleLabel}>Open to Guests</Text>
            </View>
            <Switch
              value={isHosting}
              onValueChange={toggleHosting}
              trackColor={{ false: colors.border, true: colors.greenBg }}
              thumbColor={isHosting ? colors.green : colors.ink3}
            />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/me/edit-profile' as any)}
          >
            <Ionicons name="create-outline" size={18} color={colors.amber} />
            <Text style={styles.quickActionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/me/qr-code' as any)}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.amber} />
            <Text style={styles.quickActionText}>My QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/me/gallery' as any)}
          >
            <Ionicons name="images-outline" size={18} color={colors.amber} />
            <Text style={styles.quickActionText}>Photo Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Host section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Hosting</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/me/host-listing' as any)}
          >
            <Ionicons name="bed-outline" size={18} color={colors.ink2} />
            <Text style={styles.menuItemText}>My Listing</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/me/gaestebuch' as any)}
          >
            <Ionicons name="book-outline" size={18} color={colors.ink2} />
            <Text style={styles.menuItemText}>Gaestebuch</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/me/my-project' as any)}
          >
            <Ionicons name="hammer-outline" size={18} color={colors.ink2} />
            <Text style={styles.menuItemText}>My Project</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
          </TouchableOpacity>
        </View>

        {/* Journey section — hidden in Quiet Mode */}
        {!isQuietMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/me/journey' as any)}
            >
              <Ionicons name="ribbon-outline" size={18} color={colors.ink2} />
              <Text style={styles.menuItemText}>Journey Tiers</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/me/verification' as any)}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.ink2} />
              <Text style={styles.menuItemText}>Verification</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  coverContainer: {
    height: 160,
    backgroundColor: colors.surfaceAlt,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
    paddingBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.bg,
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  togglesSection: {
    marginHorizontal: spacing.lg,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.amberLine,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.amber,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.ink3,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Courier New',
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    borderRadius: 10,
    marginBottom: 6,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
});
