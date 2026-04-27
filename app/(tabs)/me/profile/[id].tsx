import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface PublicProfile {
  id: string;
  trail_name: string;
  wanderkind_id?: string;
  bio?: string;
  avatar_url?: string;
  tier: string;
  nights_walked: number;
  nights_hosted: number;
  stamps_collected: number;
  home_country?: string;
  verification_level?: string;
  is_walking?: boolean;
}

export default function PublicProfileScreen() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!queryError && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Profile" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Profile" showBack />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.ink3} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor = tierColors[profile.tier] || colors.ink3;

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={profile.trail_name} showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={{ position: 'relative' }}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={colors.ink3} />
              </View>
            )}
            {profile.is_walking && (
              <View style={styles.walkingBadge}>
                <Text style={styles.walkingBadgeText}>W</Text>
              </View>
            )}
          </View>
        </View>

        {/* Name, Handle, and Tier */}
        <View style={styles.headerSection}>
          <Text style={styles.name}>{profile.trail_name}</Text>
          <Text style={styles.handle}>@{(profile.trail_name || '').toLowerCase().replace(/\s+/g, '.')} · {profile.wanderkind_id ?? 'WK-0000'}</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${tierColor}15` }]}>
            <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
            <Text style={[styles.tierText, { color: tierColor }]}>
              {profile.tier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Stats */}
        <WKCard style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.nights_walked}</Text>
            <Text style={styles.statLabel}>NIGHTS WALKED</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stamps_collected}</Text>
            <Text style={styles.statLabel}>STAMPS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.nights_hosted}</Text>
            <Text style={styles.statLabel}>NIGHTS HOSTED</Text>
          </View>
        </WKCard>

        {/* Home Country */}
        {profile.home_country && (
          <WKCard>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={colors.amber} />
              <Text style={styles.infoText}>From {profile.home_country}</Text>
            </View>
          </WKCard>
        )}

        {/* Verification */}
        {profile.verification_level && (
          <WKCard variant="gold">
            <View style={styles.verificationRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.gold} />
              <Text style={styles.verificationText}>
                {profile.verification_level.toUpperCase()}
              </Text>
            </View>
          </WKCard>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Send Message"
          onPress={() => router.push(`/(tabs)/messages/${id}` as any)}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="chatbubble" size={16} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.ink3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.ink2,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.phone,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.phone,
    backgroundColor: colors.surfaceAlt,
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
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 4,
  },
  handle: {
    ...typography.bodySm,
    color: colors.ink3,
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  tierText: {
    ...typography.monoXs,
    fontWeight: '600',
  },
  bio: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.amber,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderLt,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.ink2,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  verificationText: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
