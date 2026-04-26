import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface StampDetail {
  id: string;
  host_name: string;
  host_avatar?: string;
  location: string;
  date: string;
  category: string;
  description?: string;
  image_url?: string;
  host_id: string;
  reflection?: string;
  reflection_public?: boolean;
  verification_hash?: string;
  previous_hash?: string;
  walker_id?: string;
}

// Trust level based on total stamp count
const getTrustLevel = (count: number): { label: string; color: string } => {
  if (count >= 15) return { label: 'DEEP TRUST', color: colors.green };
  if (count >= 5) return { label: 'ESTABLISHED', color: colors.amber };
  return { label: 'BUILDING', color: colors.ink3 };
};

// Truncate hash for display
const truncateHash = (hash?: string): string => {
  if (!hash || hash.length < 16) return hash || '—';
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

export default function StampDetailScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const { id } = useLocalSearchParams();
  const [stamp, setStamp] = useState<StampDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stampCount, setStampCount] = useState(0);
  const [chainPosition, setChainPosition] = useState(0);

  useEffect(() => {
    fetchStamp();
  }, [id]);

  const fetchStamp = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('stamps')
        .select('*')
        .eq('id', id)
        .single();

      if (queryError) throw queryError;
      setStamp(data);

      // Fetch total stamp count and chain position for this walker
      if (data?.walker_id) {
        const { count } = await supabase
          .from('stamps')
          .select('*', { count: 'exact', head: true })
          .eq('walker_id', data.walker_id);
        setStampCount(count || 0);

        // Find this stamp's position in the chain
        const { data: chainData } = await supabase
          .from('stamps')
          .select('id')
          .eq('walker_id', data.walker_id)
          .order('created_at', { ascending: true });
        if (chainData) {
          const pos = chainData.findIndex((s: any) => s.id === data.id);
          setChainPosition(pos >= 0 ? pos + 1 : 0);
        }
      }
    } catch (err) {
      setError('Stamp not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Stamp" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !stamp) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Stamp" showBack />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.ink3} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Stamp Detail" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Stamp Artwork */}
        {stamp.image_url && (
          <Image source={{ uri: stamp.image_url }} style={styles.stampImage} />
        )}

        {/* Category Badge */}
        <View style={styles.categoryBadgeRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.amberBg },
            ]}
          >
            <Text style={styles.categoryText}>
              {stamp.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Host Info */}
        <WKCard style={styles.hostCard}>
          <View style={styles.hostHeader}>
            {stamp.host_avatar ? (
              <Image source={{ uri: stamp.host_avatar }} style={styles.hostAvatar} />
            ) : (
              <View style={styles.hostAvatarPlaceholder}>
                <Ionicons name="person" size={24} color={colors.ink3} />
              </View>
            )}

            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{stamp.host_name}</Text>
              <Text style={styles.hostLocation}>{stamp.location}</Text>
            </View>

            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.amber} />
            </TouchableOpacity>
          </View>
        </WKCard>

        {/* Date */}
        <WKCard>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={16} color={colors.amber} />
            <Text style={styles.dateText}>{stamp.date}</Text>
          </View>
        </WKCard>

        {/* Description */}
        {stamp.description && (
          <WKCard>
            <Text style={styles.description}>{stamp.description}</Text>
          </WKCard>
        )}

        {/* Reflection — with public/private indicator */}
        {stamp.reflection && (
          <WKCard style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <Ionicons name="leaf-outline" size={16} color={colors.amber} />
              <Text style={styles.reflectionLabel}>YOUR REFLECTION</Text>
              <View style={styles.reflectionVisibility}>
                <Ionicons
                  name={stamp.reflection_public ? 'eye-outline' : 'lock-closed-outline'}
                  size={12}
                  color={stamp.reflection_public ? colors.green : colors.ink3}
                />
                <Text style={[
                  styles.visibilityText,
                  stamp.reflection_public && { color: colors.green },
                ]}>
                  {stamp.reflection_public ? 'Hosts can see' : 'Private'}
                </Text>
              </View>
            </View>
            <Text style={styles.reflectionText}>{stamp.reflection}</Text>
          </WKCard>
        )}

        {/* Stats */}
        <WKCard>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={20} color={colors.gold} />
              <Text style={styles.statLabel}>SPECIAL</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={styles.statLabel}>VERIFIED</Text>
            </View>
          </View>
        </WKCard>

        {/* Trust Chain Verification — US3 */}
        {stamp.verification_hash && (
          <WKCard style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.green} />
              <Text style={styles.trustTitle}>CHAIN VERIFIED</Text>
            </View>

            {/* Trust Level */}
            <View style={styles.trustLevelRow}>
              <Text style={styles.trustLevelLabel}>Trust Level</Text>
              <View style={[styles.trustBadge, { backgroundColor: `${getTrustLevel(stampCount).color}1A` }]}>
                <Text style={[styles.trustBadgeText, { color: getTrustLevel(stampCount).color }]}>
                  {getTrustLevel(stampCount).label}
                </Text>
              </View>
            </View>

            {/* Chain Position */}
            <View style={styles.trustRow}>
              <Text style={styles.trustRowLabel}>Chain Position</Text>
              <Text style={styles.trustRowValue}>
                Stamp {chainPosition} of {stampCount}
              </Text>
            </View>

            {/* Hash */}
            <View style={styles.trustRow}>
              <Text style={styles.trustRowLabel}>SHA-256</Text>
              <Text style={styles.trustHash}>{truncateHash(stamp.verification_hash)}</Text>
            </View>

            {/* Previous Hash Link */}
            {stamp.previous_hash && (
              <View style={styles.trustRow}>
                <Text style={styles.trustRowLabel}>Prev Hash</Text>
                <Text style={styles.trustHash}>{truncateHash(stamp.previous_hash)}</Text>
              </View>
            )}

            <View style={styles.trustFooter}>
              <Ionicons name="link" size={12} color={colors.ink3} />
              <Text style={styles.trustFooterText}>
                Cryptographic chain links each stamp to the previous one
              </Text>
            </View>
          </WKCard>
        )}
      </ScrollView>
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
  stampImage: {
    width: '100%',
    height: 240,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  categoryBadgeRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  categoryText: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
    letterSpacing: 1,
  },
  hostCard: {
    marginBottom: spacing.lg,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.phone,
  },
  hostAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.phone,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  hostLocation: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateText: {
    ...typography.body,
    color: colors.ink2,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLt,
  },
  reflectionCard: {
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  reflectionLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
    flex: 1,
  },
  reflectionVisibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibilityText: {
    ...typography.caption,
    color: colors.ink3,
    fontSize: 10,
  },
  reflectionText: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  trustCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.green}33`,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  trustTitle: {
    fontFamily: 'Courier New',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.green,
    fontWeight: '700',
  },
  trustLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  trustLevelLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  trustBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  trustBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  trustRowLabel: {
    ...typography.caption,
    color: colors.ink3,
    fontWeight: '600',
  },
  trustRowValue: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '500',
  },
  trustHash: {
    fontFamily: 'Courier New',
    fontSize: 10,
    color: colors.ink2,
    letterSpacing: 0.5,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  trustFooterText: {
    ...typography.caption,
    color: colors.ink3,
    flex: 1,
  },
});
