import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { colors, typography, spacing, hostTypeConfig } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import type { Host } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function NextFreeBed() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextFreeBed();
  }, []);

  const fetchNextFreeBed = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('hosts')
        .select('*')
        .eq('is_available', true)
        .eq('hidden_from_map', false)
        .is('source_id', null)
        .in('category', ['free', 'donativo'])
        .order('route_km', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      setHost(data as Host || null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Next Free Bed" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Next Free Bed" />
        <WKEmpty
          icon="bed-outline"
          title="No Beds Available"
          message="Check back later or adjust your filters"
        />
      </SafeAreaView>
    );
  }

  const config = hostTypeConfig[host.host_type];
  const distance = host.route_km || 0;
  const walkingTime = Math.ceil(distance / 4); // Assume 4km/hour average

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Next Free Bed" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        {host.gallery && host.gallery[0] && (
          <Image source={{ uri: host.gallery[0] }} style={styles.heroImage} />
        )}

        <View style={styles.content}>
          {/* Main Card */}
          <WKCard variant="gold">
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.hostName}>{host.name}</Text>
                <Text style={styles.location}>
                  <Ionicons name="location" size={12} color={colors.ink2} />
                  {' '}{host.address || 'Location'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: config.bg }]}>
                <Text style={[styles.badgeText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            </View>

            {/* Distance & Walking Time */}
            <View style={styles.distanceCard}>
              <View style={styles.distanceItem}>
                <Ionicons name="trail-sign" size={20} color={colors.amber} />
                <Text style={styles.distanceLabel}>Distance</Text>
                <Text style={styles.distanceValue}>{distance.toFixed(1)} km</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.distanceItem}>
                <Ionicons name="time" size={20} color={colors.amber} />
                <Text style={styles.distanceLabel}>Walking Time</Text>
                <Text style={styles.distanceValue}>{walkingTime}h</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.distanceItem}>
                <Ionicons name="home" size={20} color={colors.amber} />
                <Text style={styles.distanceLabel}>Available</Text>
                <Text style={styles.distanceValue}>Now</Text>
              </View>
            </View>
          </WKCard>

          {/* Description */}
          {host.description && (
            <WKCard>
              <Text style={styles.sectionTitle}>About This Host</Text>
              <Text style={styles.description}>{host.description}</Text>
            </WKCard>
          )}

          {/* Quick Info */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Quick Info</Text>
            <View style={styles.infoGrid}>
              <InfoBox icon="home" label="Beds" value={host.capacity.toString()} />
              <InfoBox
                icon="star"
                label="Rating"
                value={host.rating ? `${host.rating.toFixed(1)}/5` : 'New'}
              />
              <InfoBox icon="people" label="Hosted" value={host.total_hosted.toString()} />
            </View>

            {/* Features */}
            {host.amenities && host.amenities.length > 0 && (
              <View style={styles.amenitiesSection}>
                <Text style={styles.amenitiesLabel}>Features</Text>
                <View style={styles.amenitiesGrid}>
                  {host.amenities.slice(0, 3).map((amenity, i) => (
                    <Text key={i} style={styles.amenity}>{amenity}</Text>
                  ))}
                </View>
              </View>
            )}
          </WKCard>

          {/* Verification */}
          {host.verification_level !== 'none' && (
            <WKCard>
              <View style={styles.verificationRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={host.verification_level === 'wanderkind' ? colors.green : colors.amber}
                />
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationTitle}>
                    {host.verification_level === 'wanderkind' ? 'Wanderkind Verified' :
                     host.verification_level === 'association' ? 'Association Verified' :
                     host.verification_level === 'community' ? 'Community Verified' :
                     'Self Verified'}
                  </Text>
                  <Text style={styles.verificationSubtitle}>
                    This host has been verified and is trusted
                  </Text>
                </View>
              </View>
            </WKCard>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <WKButton
              title="View Details"
              onPress={() => router.push(`/(tabs)/map/host/${host.id}`)}
              variant="secondary"
              fullWidth
            />
            <WKButton
              title="Request Stay"
              onPress={() => router.push(`/(tabs)/messages?hostId=${host.id}`)}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Ionicons name={icon as any} size={16} color={colors.amber} />
      <Text style={styles.infoBoxLabel}>{label}</Text>
      <Text style={styles.infoBoxValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  hostName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  location: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  distanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  distanceLabel: {
    ...typography.caption,
    color: colors.ink2,
  },
  distanceValue: {
    ...typography.h3,
    color: colors.amber,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(200,118,42,0.1)',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoBoxLabel: {
    ...typography.caption,
    color: colors.parchmentSoft,
  },
  infoBoxValue: {
    ...typography.h3,
    color: colors.ink,
  },
  amenitiesSection: {
    gap: spacing.sm,
  },
  amenitiesLabel: {
    ...typography.bodySm,
    color: colors.parchmentSoft,
    marginBottom: spacing.xs,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  amenity: {
    ...typography.bodySm,
    color: colors.parchmentInk,
    backgroundColor: 'rgba(200,118,42,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  verificationSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  buttonGroup: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
});
