import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii, hostTypeConfig } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

interface HostListing {
  id: string;
  title: string;
  description: string;
  host_type: 'free' | 'donativo' | 'budget' | 'paid';
  max_guests: number;
  capacity: number;
  location: string;
  rating: number;
  reviews_count: number;
  image_url?: string;
}

export default function HostListingScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user } = useAuth();
  const [listing, setListing] = useState<HostListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [user?.id]);

  const fetchListing = async () => {
    try {
      if (!user) return;
      const { data } = await supabase
        .from('host_listings')
        .select('*')
        .eq('host_id', user.id)
        .single();

      setListing(data);
    } catch (err) {
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Your Listing" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Your Listing" showBack />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyContainer}>
            <Ionicons name="home" size={48} color={colors.ink3} />
            <Text style={styles.emptyText}>No listing yet</Text>
            <Text style={styles.emptySubtext}>
              Create your host listing to welcome wanderers
            </Text>
          </View>
        </ScrollView>
        <View style={styles.actions}>
          <WKButton
            title="Create Listing"
            onPress={() => router.push('/(tabs)/me/hosting/create' as any)}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const hostConfig = hostTypeConfig[listing.host_type];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Your Listing" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          How walkers see your listing
        </Text>

        {/* Preview Card */}
        <WKCard style={styles.previewCard}>
          {listing.image_url && (
            <Image source={{ uri: listing.image_url }} style={styles.listingImage} />
          )}

          <View style={styles.listingHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.listingTitle} numberOfLines={2}>
                {listing.title}
              </Text>
              <View style={[styles.hostBadge, { backgroundColor: hostConfig.bg }]}>
                <Text style={[styles.hostBadgeText, { color: hostConfig.color }]}>
                  {hostConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={styles.ratingValue}>{listing.rating}</Text>
              </View>
              <Text style={styles.reviewCount}>
                ({listing.reviews_count} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.descContainer}>
            <Text style={styles.description} numberOfLines={3}>
              {listing.description}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <Ionicons name="people" size={16} color={colors.amber} />
              <Text style={styles.detailText}>Up to {listing.max_guests}</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="location" size={16} color={colors.amber} />
              <Text style={styles.detailText}>{listing.location}</Text>
            </View>
          </View>
        </WKCard>

        {/* Stats */}
        <WKCard>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {profile?.nights_hosted ?? 0}
              </Text>
              <Text style={styles.statLabel}>NIGHTS HOSTED</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {profile?.guests_count ?? 0}
              </Text>
              <Text style={styles.statLabel}>GUESTS</Text>
            </View>
          </View>
        </WKCard>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            Your listing is visible to all wanderers on the map when they're looking for accommodation.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Edit Listing"
          onPress={() => router.push('/(tabs)/me/hosting/listing-edit' as any)}
          variant="secondary"
          size="lg"
          fullWidth
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  previewCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 160,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: spacing.lg,
  },
  listingHeader: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listingTitle: {
    ...typography.h3,
    color: colors.ink,
    flex: 1,
  },
  hostBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  hostBadgeText: {
    ...typography.monoXs,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingValue: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '600',
  },
  reviewCount: {
    ...typography.caption,
    color: colors.ink3,
  },
  descContainer: {
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  detailsRow: {
    gap: spacing.md,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  statsRow: {
    flexDirection: 'row',
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
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderLt,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
