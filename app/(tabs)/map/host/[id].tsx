import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { colors, typography, spacing, shadows, hostTypeConfig, getFreshnessBadge, getResponseTimeBadge, dataSourceConfig } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import type { Host, GuestbookEntry } from '../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useFavoritesStore } from '../../../../src/stores/favorites';
import { useAuthStore } from '../../../../src/stores/auth';

export default function HostDetail() {
  const { user, isLoading } = useAuthGuard();
  const { profile } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [host, setHost] = useState<Host | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [nearbyHosts, setNearbyHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, loadFavorites } = useFavoritesStore();
  const [confirmCount, setConfirmCount] = useState(0);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (isLoading) return null;


  useEffect(() => {
    if (id) {
      fetchHost();
    }
    if (user) {
      loadFavorites(user.id);
    }
  }, [id, user]);

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

      // Fetch confirmation count
      const { count } = await supabase
        .from('host_confirmations')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', id);
      setConfirmCount(count || 0);

      // Check if current user confirmed
      if (user) {
        const { data: myConf } = await supabase
          .from('host_confirmations')
          .select('id')
          .eq('host_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasConfirmed(!!myConf);
      }

      // Fetch nearby hosts for "Next Roof" carousel
      if (hostData) {
        const h = hostData as Host;
        const { data: nearby } = await supabase
          .from('hosts')
          .select('*')
          .eq('is_available', true)
          .neq('id', id)
          .gte('lat', h.lat - 0.5)
          .lte('lat', h.lat + 0.5)
          .gte('lng', h.lng - 0.5)
          .lte('lng', h.lng + 0.5)
          .order('rating', { ascending: false })
          .limit(5);
        setNearbyHosts((nearby as Host[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load host');
    } finally {
      setLoading(false);
    }
  };

  const openDirections = () => {
    if (!host) return;
    const { lat, lng, name } = host;
    const mobility = (profile as any)?.mobility_type || 'walk';
    // Map mobility type to platform-specific travel modes
    const iosModes: Record<string, string> = { walk: 'w', cycle: 'b', run: 'w' };
    const androidModes: Record<string, string> = { walk: 'w', cycle: 'b', run: 'w' };
    const webModes: Record<string, string> = { walk: 'walking', cycle: 'bicycling', run: 'walking' };
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps:?daddr=${lat},${lng}&dirflg=${iosModes[mobility] || 'w'}`);
    } else if (Platform.OS === 'android') {
      Linking.openURL(`google.navigation:q=${lat},${lng}&mode=${androidModes[mobility] || 'w'}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${webModes[mobility] || 'walking'}`);
    }
  };

  const getDistanceKm = (h1: Host, h2: Host): number => {
    const R = 6371;
    const dLat = (h2.lat - h1.lat) * Math.PI / 180;
    const dLng = (h2.lng - h1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(h1.lat * Math.PI / 180) * Math.cos(h2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const confirmHost = async () => {
    if (!user || hasConfirmed || confirming) return;
    setConfirming(true);
    try {
      // Check if user already confirmed
      const { data: existing } = await supabase
        .from('host_confirmations')
        .select('id')
        .eq('host_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setHasConfirmed(true);
        setConfirming(false);
        return;
      }

      // Insert confirmation
      await supabase.from('host_confirmations').insert({
        host_id: id,
        user_id: user.id,
      });

      // Update host's last_confirmed
      await supabase.from('hosts').update({
        last_confirmed: new Date().toISOString(),
      }).eq('id', id);

      setConfirmCount(prev => prev + 1);
      setHasConfirmed(true);
    } catch (err) {
      // Silently fail — not critical
    } finally {
      setConfirming(false);
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
  const isFav = isFavorite(host.id);
  const freshness = getFreshnessBadge((host as any).last_confirmed);
  const responseTime = getResponseTimeBadge((host as any).avg_response_minutes);
  const dataSource = dataSourceConfig[(host as any).data_source] || dataSourceConfig.community_report;

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
                <View style={styles.nameWithFav}>
                  <Text style={styles.hostName}>{host.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(host.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isFav ? 'heart' : 'heart-outline'}
                      size={22}
                      color={isFav ? colors.red : colors.ink3}
                    />
                  </TouchableOpacity>
                </View>
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

            {/* Trust Badges */}
            <View style={styles.trustRow}>
              <View style={[styles.trustBadge, { backgroundColor: freshness.bg }]}>
                <Ionicons name={freshness.icon as any} size={11} color={freshness.color} />
                <Text style={[styles.trustLabel, { color: freshness.color }]}>{freshness.label}</Text>
              </View>
              <View style={[styles.trustBadge, { backgroundColor: 'rgba(155,142,126,0.06)' }]}>
                <Ionicons name="shield-checkmark-outline" size={11} color={dataSource.color} />
                <Text style={[styles.trustLabel, { color: dataSource.color }]}>{dataSource.label}</Text>
              </View>
              <View style={[styles.trustBadge, { backgroundColor: responseTime.bg }]}>
                <Ionicons name={responseTime.icon as any} size={11} color={responseTime.color} />
                <Text style={[styles.trustLabel, { color: responseTime.color }]}>{responseTime.label}</Text>
              </View>
              {host.verification_level !== 'none' && (
                <View style={[styles.trustBadge, { backgroundColor: 'rgba(39,134,74,0.06)' }]}>
                  <Ionicons name="shield-checkmark" size={11} color={verificationColor} />
                  <Text style={[styles.trustLabel, { color: verificationColor }]}>
                    {host.verification_level.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Price Range */}
            {(host as any).price_range && (
              <View style={styles.priceRow}>
                <Ionicons name="wallet-outline" size={14} color={colors.ink2} />
                <Text style={styles.priceText}>{(host as any).price_range}</Text>
              </View>
            )}

            {/* Key Stats */}
            <View style={styles.statsRow}>
              <StatItem icon="home" label="Beds" value={host.capacity.toString()} />
              <StatItem icon="star" label="Rating" value={host.rating ? `${host.rating.toFixed(1)}/5` : 'New'} />
              <StatItem icon="people" label="Hosted" value={host.total_hosted.toString()} />
            </View>
          </WKCard>

          {/* === ACTION LAYER === */}
          <View style={styles.actionBar}>
            {(host as any).phone ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${(host as any).phone}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(90,122,43,0.1)' }]}>
                  <Ionicons name="call" size={18} color={colors.green} />
                </View>
                <Text style={styles.actionLabel}>Call</Text>
              </TouchableOpacity>
            ) : null}
            {(host as any).email ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`mailto:${(host as any).email}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.amberBg }]}>
                  <Ionicons name="mail" size={18} color={colors.amber} />
                </View>
                <Text style={styles.actionLabel}>Email</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={openDirections}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.blueBg }]}>
                <Ionicons name="navigate" size={18} color={colors.blue} />
              </View>
              <Text style={styles.actionLabel}>Directions</Text>
            </TouchableOpacity>
            {(host as any).website ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL((host as any).website)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(155,142,126,0.08)' }]}>
                  <Ionicons name="globe-outline" size={18} color={colors.ink2} />
                </View>
                <Text style={styles.actionLabel}>Website</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/(tabs)/messages?hostId=${host.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.amberBg }]}>
                <Ionicons name="paper-plane" size={18} color={colors.amber} />
              </View>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Features — show all */}
          {host.amenities && host.amenities.length > 0 && (
            <WKCard>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.amenitiesGrid}>
                {host.amenities.map((amenity, i) => (
                  <View key={i} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </WKCard>
          )}

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

          {/* Community Verification */}
          <WKCard>
            <Text style={styles.sectionTitle}>Community Trust</Text>
            {confirmCount > 0 && (
              <View style={styles.confirmCountRow}>
                <Ionicons name="people" size={14} color={colors.green} />
                <Text style={styles.confirmCountText}>
                  Confirmed by {confirmCount} wanderkind{confirmCount !== 1 ? 'er' : ''}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                hasConfirmed && styles.confirmBtnDone,
              ]}
              onPress={confirmHost}
              disabled={hasConfirmed || confirming}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasConfirmed ? 'checkmark-circle' : 'shield-checkmark-outline'}
                size={18}
                color={hasConfirmed ? colors.green : colors.amber}
              />
              <Text style={[
                styles.confirmBtnText,
                hasConfirmed && styles.confirmBtnTextDone,
              ]}>
                {hasConfirmed ? 'You confirmed this listing' : confirming ? 'Confirming...' : 'Confirm this listing is accurate'}
              </Text>
            </TouchableOpacity>
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

          {/* === NEXT ROOF CAROUSEL === */}
          {nearbyHosts.length > 0 && (
            <View style={styles.nextRoofSection}>
              <Text style={styles.nextRoofTitle}>Next Roof Ahead</Text>
              <Text style={styles.nextRoofSubtitle}>Nearby places to stay</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nextRoofScroll}
              >
                {nearbyHosts.map((nearby) => {
                  const nConfig = hostTypeConfig[nearby.host_type as keyof typeof hostTypeConfig];
                  const distKm = getDistanceKm(host, nearby);
                  return (
                    <TouchableOpacity
                      key={nearby.id}
                      style={styles.nextRoofCard}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/(tabs)/map/host/${nearby.id}`)}
                    >
                      <View style={[styles.nrBadge, { backgroundColor: nConfig?.bg ?? colors.amberBg }]}>
                        <Text style={[styles.nrBadgeText, { color: nConfig?.color ?? colors.amber }]}>
                          {nConfig?.label ?? 'HOST'}
                        </Text>
                      </View>
                      <Text style={styles.nrName} numberOfLines={2}>{nearby.name}</Text>
                      <Text style={styles.nrLocation} numberOfLines={1}>
                        {(nearby as any).region || nearby.address || 'Along the Way'}
                      </Text>
                      <View style={styles.nrFooter}>
                        <View style={styles.nrStat}>
                          <Ionicons name="walk-outline" size={12} color={colors.amber} />
                          <Text style={styles.nrStatText}>
                            {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                          </Text>
                        </View>
                        {nearby.rating ? (
                          <View style={styles.nrStat}>
                            <Ionicons name="star" size={12} color={colors.gold} />
                            <Text style={styles.nrStatText}>{nearby.rating.toFixed(1)}</Text>
                          </View>
                        ) : null}
                        <View style={styles.nrStat}>
                          <Ionicons name="bed-outline" size={12} color={colors.ink3} />
                          <Text style={styles.nrStatText}>{nearby.capacity}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Primary CTA */}
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
  nameWithFav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  trustLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
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
  // Action Layer
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadows.sm,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.ink2,
  },
  // Next Roof carousel
  nextRoofSection: {
    marginTop: spacing.sm,
  },
  nextRoofTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: 2,
  },
  nextRoofSubtitle: {
    ...typography.bodySm,
    color: colors.ink3,
    marginBottom: spacing.md,
  },
  nextRoofScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  nextRoofCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  nrBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  nrBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nrName: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
    lineHeight: 18,
  },
  nrLocation: {
    ...typography.caption,
    color: colors.ink3,
    marginBottom: spacing.sm,
  },
  nrFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    paddingTop: spacing.sm,
  },
  nrStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nrStatText: {
    ...typography.caption,
    color: colors.ink2,
    fontWeight: '500',
  },
  confirmCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confirmCountText: {
    ...typography.bodySm,
    color: colors.green,
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amberLine,
    backgroundColor: colors.amberBg,
  },
  confirmBtnDone: {
    backgroundColor: 'rgba(39,134,74,0.06)',
    borderColor: 'rgba(39,134,74,0.15)',
  },
  confirmBtnText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.amber,
  },
  confirmBtnTextDone: {
    color: colors.green,
  },
  requestButton: {
    marginVertical: spacing.lg,
  },
});
