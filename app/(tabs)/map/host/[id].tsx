import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { colors, typography, spacing, shadows, hostTypeConfig } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import type { Host, GuestbookEntry } from '../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function HostDetail() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [host, setHost] = useState<Host | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchHost();
    }
  }, [id]);

  const fetchHost = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: hostData, error: hostError } = await supabase
        .from('hosts')
        .select('*')
        .eq('id', id)
        .single();

      if (hostError) throw hostError;

      const { data: entriesData } = await supabase
        .from('gaestebuch')
        .select('*')
        .eq('host_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      setHost(hostData as Host);
      setEntries(entriesData as GuestbookEntry[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load host');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Host Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Host Details" />
        <WKEmpty
          icon="alert-circle-outline"
          title="Unable to Load"
          message={error || 'Host not found'}
        />
      </SafeAreaView>
    );
  }

  const config = hostTypeConfig[host.host_type];
  const verificationColor = host.verification_level === 'wanderkind' ? colors.green
    : host.verification_level === 'association' ? colors.gold
    : host.verification_level === 'community' ? colors.amber
    : colors.ink3;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={host.name} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {host.gallery && host.gallery[0] && (
          <Image
            source={{ uri: host.gallery[0] }}
            style={styles.heroImage}
          />
        )}

        {/* Host Info Card */}
        <View style={styles.content}>
          <WKCard variant="gold">
            <View style={styles.header}>
              <View style={styles.titleSection}>
                <Text style={styles.hostName}>{host.name}</Text>
                <Text style={styles.location}>
                  <Ionicons name="location" size={13} color={colors.ink2} />
                  {' '}{host.address || 'Location not specified'}
                </Text>
              </View>
              {config && (
                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.badgeText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Verification Badge */}
            {host.verification_level !== 'none' && (
              <View style={styles.verificationRow}>
                <Ionicons name="shield-checkmark" size={14} color={verificationColor} />
                <Text style={[styles.verificationText, { color: verificationColor }]}>
                  {host.verification_level.toUpperCase()} VERIFIED
                </Text>
              </View>
            )}

            {/* Key Stats */}
            <View style={styles.statsRow}>
              <StatItem
                icon="home"
                label="Beds"
                value={host.capacity.toString()}
              />
              <StatItem
                icon="star"
                label="Rating"
                value={host.rating ? `${host.rating.toFixed(1)}/5` : 'New'}
              />
              <StatItem
                icon="people"
                label="Hosted"
                value={host.total_hosted.toString()}
              />
            </View>

            {/* Amenities */}
            {host.amenities && host.amenities.length > 0 && (
              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {host.amenities.slice(0, 4).map((amenity, i) => (
                    <View key={i} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </WKCard>

          {/* Description */}
          {host.description && (
            <WKCard>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{host.description}</Text>
            </WKCard>
          )}

          {/* Availability */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityRow}>
              <Ionicons
                name={host.is_available ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={host.is_available ? colors.green : colors.red}
              />
              <Text style={[
                styles.availabilityText,
                { color: host.is_available ? colors.green : colors.red }
              ]}>
                {host.is_available ? 'Currently Available' : 'Not Available'}
              </Text>
            </View>
            {host.availability_notes && (
              <Text style={styles.availabilityNotes}>{host.availability_notes}</Text>
            )}
          </WKCard>

          {/* Guestbook */}
          {entries.length > 0 && (
            <WKCard>
              <Text style={styles.sectionTitle}>Guestbook ({entries.length})</Text>
              <View style={styles.guestbookList}>
                {entries.map((entry) => (
                  <View key={entry.id} style={styles.guestbookEntry}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryName}>{entry.walker_name}</Text>
                      {entry.rating && (
                        <Text style={styles.entryRating}>
                          {'★'.repeat(entry.rating)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.entryMessage}>{entry.message}</Text>
                  </View>
                ))}
              </View>
            </WKCard>
          )}

          {/* Request Stay Button */}
          <WKButton
            title="Request Stay"
            onPress={() => router.push(`/(tabs)/messages?hostId=${host.id}`)}
            fullWidth
            style={styles.requestButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={16} color={colors.amber} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    height: 200,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleSection: {
    flex: 1,
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
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  verificationText: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.ink2,
  },
  statValue: {
    ...typography.h3,
    color: colors.ink,
  },
  amenitiesSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityTag: {
    backgroundColor: colors.amberBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  amenityText: {
    ...typography.bodySm,
    color: colors.amber,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  availabilityText: {
    ...typography.body,
    fontWeight: '600',
  },
  availabilityNotes: {
    ...typography.bodySm,
    color: colors.ink2,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  guestbookList: {
    gap: spacing.md,
  },
  guestbookEntry: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  entryRating: {
    ...typography.bodySm,
    color: colors.gold,
  },
  entryMessage: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  requestButton: {
    marginVertical: spacing.lg,
  },
});
