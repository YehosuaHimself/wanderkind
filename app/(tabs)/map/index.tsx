import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows, hostTypeConfig } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Host } from '../../../src/types/database';

const { width, height } = Dimensions.get('window');

// Default to central Europe
const INITIAL_REGION = {
  latitude: 47.5,
  longitude: 7.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

type FilterMode = 'free' | 'donativo' | 'all';

export default function MapHome() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filter, setFilter] = useState<FilterMode>('free');
  const [isListView, setIsListView] = useState(false);
  const [nearestFree, setNearestFree] = useState<Host | null>(null);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    const { data } = await supabase
      .from('hosts')
      .select('*')
      .eq('is_available', true)
      .order('total_hosted', { ascending: false });

    if (data) {
      setHosts(data as Host[]);
      const free = data.find(h => h.host_type === 'free' || h.host_type === 'donativo');
      setNearestFree(free as Host | null);
    }
  };

  const filteredHosts = hosts.filter(h => {
    if (filter === 'free') return h.host_type === 'free';
    if (filter === 'donativo') return h.host_type === 'donativo';
    return true;
  });

  const getMarkerColor = (type: string) => {
    const config = hostTypeConfig[type as keyof typeof hostTypeConfig];
    return config?.color ?? colors.ink3;
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {filteredHosts.map(host => (
          <Marker
            key={host.id}
            coordinate={{ latitude: host.lat, longitude: host.lng }}
            pinColor={getMarkerColor(host.host_type)}
            onPress={() => router.push(`/(tabs)/map/host/${host.id}`)}
          />
        ))}
      </MapView>

      {/* Top controls overlay */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['free', 'donativo', 'all'] as FilterMode[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'free' ? 'FREE' : f === 'donativo' ? 'FREE + DONATIVO' : 'ALL'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsListView(!isListView)}
          >
            <Ionicons
              name={isListView ? 'map-outline' : 'list-outline'}
              size={18}
              color={colors.amber}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* My location button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => {
          // Center on user location
        }}
      >
        <Ionicons name="locate" size={20} color={colors.amber} />
      </TouchableOpacity>

      {/* Next Free Bed widget */}
      {nearestFree && (
        <TouchableOpacity
          style={styles.nextFreeCard}
          onPress={() => router.push(`/(tabs)/map/host/${nearestFree.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.nextFreeHeader}>
            <View style={styles.goldDot} />
            <Text style={styles.nextFreeLabel}>NEXT FREE BED</Text>
          </View>
          <Text style={styles.nextFreeName} numberOfLines={1}>{nearestFree.name}</Text>
          <View style={styles.nextFreeRow}>
            <Text style={styles.nextFreeDistance}>
              {nearestFree.route_km ? `${nearestFree.route_km} km` : 'Nearby'}
            </Text>
            <View style={[
              styles.nextFreeBadge,
              { backgroundColor: hostTypeConfig[nearestFree.host_type]?.bg ?? colors.amberBg }
            ]}>
              <Text style={[
                styles.nextFreeBadgeText,
                { color: hostTypeConfig[nearestFree.host_type]?.color ?? colors.amber }
              ]}>
                {hostTypeConfig[nearestFree.host_type]?.label ?? 'HOST'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.amber} />
          </View>
        </TouchableOpacity>
      )}

      {/* SOS long-press hint (shown once) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  filterText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 1,
    color: colors.ink2,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  locationButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 180,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  nextFreeCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    ...shadows.lg,
  },
  nextFreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  goldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  nextFreeLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.gold,
    fontWeight: '600',
  },
  nextFreeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  nextFreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextFreeDistance: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
  },
  nextFreeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  nextFreeBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '600',
  },
});
