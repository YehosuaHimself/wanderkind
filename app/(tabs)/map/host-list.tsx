import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { colors, typography, spacing, shadows, hostTypeConfig, getFreshnessBadge, getResponseTimeBadge, dataSourceConfig } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import type { Host, HostType } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useFavoritesStore } from '../../../src/stores/favorites';
import { useAuthStore } from '../../../src/stores/auth';
import { getRouteRelativeDistance } from '../../../src/lib/route-distance';

// Simplified route lookup for host list
const ROUTE_LOOKUP: Record<string, [number, number][]> = {
  'koenigsweg': [[47.63,13],[47.42,13.07],[47.27,12.39],[47.26,11.39],[47.17,10.21],[47.37,9.75],[47.43,9.38],[47.13,8.75],[47,8],[46.95,7.44],[46.52,6.63],[46.2,6.14],[45.9,5.77],[45.44,4.39],[45.05,3.89],[44.84,3.18],[44.37,2.58],[43.93,2.15],[43.6,1.44],[43.3,0.5],[42.88,-0.3],[42.82,-1.64],[42.47,-2.33],[42.34,-3.7],[42.6,-5.57],[42.46,-6.05],[42.44,-7.01],[42.88,-8.54]],
  'camino-frances': [[43.01,-1.32],[42.97,-1.39],[42.82,-1.64],[42.67,-2.03],[42.47,-2.33],[42.34,-3.7],[42.27,-4.54],[42.6,-5.57],[42.46,-6.05],[42.44,-7.01],[42.88,-8.54]],
  'via-francigena': [[51.28,1.08],[50.94,1.86],[49.9,2.3],[49.25,4.03],[48.3,5.38],[47.47,7.35],[46.95,7.44],[46.52,6.63],[46,8.95],[45.46,9.19],[44.72,10.35],[43.77,11.25],[43.32,11.33],[42.73,11.79],[42.29,12.24],[41.9,12.45]],
  'camino-portugues': [[41.15,-8.61],[41.37,-8.76],[41.69,-8.83],[42.05,-8.63],[42.43,-8.64],[42.63,-8.62],[42.88,-8.54]],
};

type FilterMode = HostType | 'all' | 'saved';


export default function HostList() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);
  const { favoriteHostIds, loadFavorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const { profile } = useAuthStore();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Get user location for route-relative distance
  useEffect(() => {
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    fetchHosts();
    if (user) {
      loadFavorites(user.id);
    }
  }, [user]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('hosts')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });

      setHosts(data as Host[] || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredHosts = hosts.filter(h => {
    if (filter === 'saved') {
      return favoriteHostIds.has(h.id);
    }
    if (filter === 'all') {
      return true;
    }
    return h.host_type === filter;
  });

  const renderHostCard = useCallback(
    ({ item: host }: { item: Host }) => {
      const config = hostTypeConfig[host.host_type];
      // Route-relative distance when user has active way + location
      let distance = host.route_km ? `${host.route_km} km` : 'Nearby';
      if (userLat != null && userLng != null && profile?.current_way) {
        const routeCoords = ROUTE_LOOKUP[profile.current_way];
        if (routeCoords) {
          const rel = getRouteRelativeDistance(userLat, userLng, host.lat, host.lng, routeCoords);
          if (rel) {
            const d = rel.distanceKm;
            const label = rel.ahead ? 'ahead' : 'behind';
            distance = d < 1 ? `${Math.round(d * 1000)} m ${label}` : d < 100 ? `${d.toFixed(1)} km ${label}` : `${Math.round(d)} km ${label}`;
          }
        }
      }
      const isFav = isFavorite(host.id);

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(tabs)/map/host/${host.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.hostInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.hostName} numberOfLines={1}>{host.name}</Text>
                <TouchableOpacity
                  onPress={() => toggleFavorite(host.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFav ? colors.red : colors.ink3}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.location} numberOfLines={1}>
                <Ionicons name="location" size={12} color={colors.ink3} />
                {' '}{host.address || 'Location'}
              </Text>
            </View>

            <View style={styles.rightSection}>
              <View style={[styles.badge, { backgroundColor: config.bg }]}>
                <Text style={[styles.badgeText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
              <Text style={styles.distance}>{distance}</Text>
            </View>
          </View>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            {(() => {
              const fresh = getFreshnessBadge((host as any).last_confirmed);
              return (
                <View style={[styles.trustBadge, { backgroundColor: fresh.bg }]}>
                  <Ionicons name={fresh.icon as any} size={10} color={fresh.color} />
                  <Text style={[styles.trustText, { color: fresh.color }]}>{fresh.label}</Text>
                </View>
              );
            })()}
            {(() => {
              const src = dataSourceConfig[(host as any).data_source] || dataSourceConfig.community_report;
              return (
                <View style={[styles.trustBadge, { backgroundColor: 'rgba(155,142,126,0.06)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={10} color={src.color} />
                  <Text style={[styles.trustText, { color: src.color }]}>{src.label}</Text>
                </View>
              );
            })()}
            {(() => {
              const resp = getResponseTimeBadge((host as any).avg_response_minutes);
              return (
                <View style={[styles.trustBadge, { backgroundColor: resp.bg }]}>
                  <Ionicons name={resp.icon as any} size={10} color={resp.color} />
                  <Text style={[styles.trustText, { color: resp.color }]}>{resp.label}</Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.ratingRow}>
              {host.rating && (
                <>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.rating}>{host.rating.toFixed(1)}</Text>
                </>
              )}
            </View>
            <View style={styles.capacityRow}>
              <Ionicons name="home" size={14} color={colors.amber} />
              <Text style={styles.capacity}>{host.capacity} bed{host.capacity !== 1 ? 's' : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </View>
        </TouchableOpacity>
      );
    },
    [router, userLat, userLng, profile, isFavorite, toggleFavorite]
  );

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="All Hosts" />

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.chip, filter === 'all' && styles.chipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filter === 'saved' && styles.chipActive]}
          onPress={() => setFilter('saved')}
        >
          <Text style={[styles.chipText, filter === 'saved' && styles.chipTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>

        {(['free', 'donativo', 'budget', 'paid'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {hostTypeConfig[f].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Host List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      ) : filteredHosts.length === 0 ? (
        <WKEmpty
          icon="home-outline"
          title="No hosts found"
          message="Try adjusting your search or exploring a different area."
        />
      ) : (
        <FlatList
          data={filteredHosts}
          renderItem={renderHostCard}
          keyExtractor={h => h.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  chipText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.ink2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.md,
  },
  hostInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
    flex: 1,
  },
  location: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.sm,
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
  distance: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rating: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  capacity: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  trustText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
