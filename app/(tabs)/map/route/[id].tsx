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
import type { Route, Host } from '../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function RouteDetail() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRoute();
    }
  }, [id]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (routeError) throw routeError;

      const { data: hostsData } = await supabase
        .from('hosts')
        .select('*')
        .eq('route_id', id)
        .order('route_km', { ascending: true });

      setRoute(routeData as Route);
      setHosts(hostsData as Host[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Route Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !route) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Route Details" />
        <WKEmpty
          icon="alert-circle-outline"
          title="Unable to Load"
          message={error || 'Route not found'}
        />
      </SafeAreaView>
    );
  }

  const difficultyColor = route.difficulty === 'easy' ? colors.green
    : route.difficulty === 'moderate' ? colors.amber
    : colors.red;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={route.name} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {route.hero_image && (
          <Image source={{ uri: route.hero_image }} style={styles.heroImage} />
        )}

        <View style={styles.content}>
          {/* Route Overview Card */}
          <WKCard variant="gold">
            <Text style={styles.routeName}>{route.name}</Text>
            <View style={styles.countriesRow}>
              {route.countries.map((country, i) => (
                <View key={i} style={styles.countryBadge}>
                  <Text style={styles.countryText}>{country.toUpperCase()}</Text>
                </View>
              ))}
            </View>

            {/* Key Stats */}
            <View style={styles.statsGrid}>
              <StatBox
                icon="trail-sign"
                label="Distance"
                value={`${route.distance_km} km`}
              />
              <StatBox
                icon="calendar"
                label="Duration"
                value={`${route.duration_days} days`}
              />
              <StatBox
                icon="trending-up"
                label="Difficulty"
                value={route.difficulty.toUpperCase()}
                valueColor={difficultyColor}
              />
            </View>
          </WKCard>

          {/* Description */}
          {route.description && (
            <WKCard>
              <Text style={styles.sectionTitle}>About This Way</Text>
              <Text style={styles.description}>{route.description}</Text>
            </WKCard>
          )}

          {/* Statistics */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Community</Text>
            <View style={styles.communityStats}>
              <View style={styles.statRow}>
                <Ionicons name="bed-outline" size={16} color={colors.amber} />
                <Text style={styles.statLabel}>{route.host_count} total hosts</Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="gift-outline" size={16} color={colors.green} />
                <Text style={styles.statLabel}>{route.free_host_count} free beds</Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="people-outline" size={16} color={colors.blue} />
                <Text style={styles.statLabel}>{route.walker_count} active walkers</Text>
              </View>
            </View>
          </WKCard>

          {/* Hosts Along Route */}
          {hosts.length > 0 && (
            <WKCard>
              <Text style={styles.sectionTitle}>Hosts Along the Way</Text>
              <View style={styles.hostsList}>
                {hosts.map((host) => {
                  const config = hostTypeConfig[host.host_type];
                  return (
                    <View key={host.id} style={styles.hostRow}>
                      <View style={styles.hostMileage}>
                        <Text style={styles.mileageKm}>{host.route_km || '?'}</Text>
                        <Text style={styles.mileageLabel}>km</Text>
                      </View>
                      <View style={styles.hostDetails}>
                        <Text style={styles.hostName} numberOfLines={1}>{host.name}</Text>
                        <Text style={styles.hostAddress} numberOfLines={1}>
                          {host.address || 'Location'}
                        </Text>
                      </View>
                      <View style={[styles.hostBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.hostBadgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </WKCard>
          )}

          {/* Elevation Profile Placeholder */}
          <WKCard>
            <Text style={styles.sectionTitle}>Elevation Profile</Text>
            <View style={styles.elevationPlaceholder}>
              <Ionicons name="mountain" size={32} color={colors.amberBg} />
              <Text style={styles.elevationPlaceholderText}>Coming soon</Text>
            </View>
          </WKCard>

          {/* Begin Button */}
          <WKButton
            title="Begin This Way"
            onPress={() => {
              // Navigate to walking mode or map
            }}
            fullWidth
            style={styles.beginButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={18} color={colors.amber} />
      <Text style={styles.statBoxLabel}>{label}</Text>
      <Text style={[styles.statBoxValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
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
    height: 240,
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
  routeName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  countriesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  countryBadge: {
    backgroundColor: 'rgba(200,118,42,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  countryText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.amber,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statBoxLabel: {
    ...typography.caption,
    color: colors.ink2,
  },
  statBoxValue: {
    ...typography.h3,
    color: colors.ink,
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
  communityStats: {
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statLabel: {
    ...typography.body,
    color: colors.ink2,
  },
  hostsList: {
    gap: spacing.md,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  hostMileage: {
    alignItems: 'center',
  },
  mileageKm: {
    ...typography.h3,
    color: colors.amber,
  },
  mileageLabel: {
    fontFamily: 'Courier New',
    fontSize: 8,
    color: colors.ink3,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  hostAddress: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  hostBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  elevationPlaceholder: {
    height: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  elevationPlaceholderText: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  beginButton: {
    marginVertical: spacing.lg,
  },
});
