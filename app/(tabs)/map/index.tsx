import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
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

// Dynamically import native-only modules (these crash on web)
let MapView: any, Marker: any, PROVIDER_GOOGLE: any, Location: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  Location = require('expo-location');
}

// Web-only map component using Leaflet
function WebMapComponent({ hosts, filter, onHostPress }: { hosts: Host[]; filter: FilterMode; onHostPress: (id: string) => void }) {
  const iframeRef = useRef<any>(null);

  // Build filtered hosts list
  const filteredHosts = hosts.filter(h => {
    if (filter === 'free') return h.host_type === 'free';
    if (filter === 'donativo') return h.host_type === 'free' || h.host_type === 'donativo';
    return true;
  });

  // Map host type to marker color
  const getMarkerColor = (type: string): string => {
    const config = hostTypeConfig[type as keyof typeof hostTypeConfig];
    if (!config) return colors.ink3;
    return config.color;
  };

  // Pre-compute marker colors for all filtered hosts
  const markerColorMap: Record<string, string> = {};
  filteredHosts.forEach(h => {
    markerColorMap[h.id] = getMarkerColor(h.host_type);
  });

  // Build HTML with Leaflet map
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #map { width: 100%; height: 100vh; }
    .leaflet-container { background: #f5f5f0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map centered on central Europe
    const map = L.map('map').setView([47.5, 7.5], 6);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Hosts data (injected from React)
    const hosts = ${JSON.stringify(filteredHosts)};
    const markerColorMap = ${JSON.stringify(markerColorMap)};

    // Add markers for each host
    hosts.forEach(function(host) {
      const markerColor = markerColorMap[host.id] || '#999999';

      // Create circle marker (more visible than default pins)
      L.circleMarker([host.lat, host.lng], {
        radius: 8,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      })
      .bindPopup(function() {
        return '<div style="font-size: 12px; text-align: center;"><strong>' + host.name + '</strong></div>';
      })
      .on('click', function(e) {
        // Send message to parent about host click
        window.parent.postMessage({
          type: 'host-click',
          hostId: host.id
        }, '*');
      })
      .addTo(map);
    });

    // Handle location request from parent
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'center-on-location') {
        const { lat, lng } = event.data;
        map.setView([lat, lng], 10, { animate: true, duration: 1 });
      }
    });
  </script>
</body>
</html>`;

  // Handle iframe messages for marker clicks
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'host-click') {
        onHostPress(event.data.hostId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHostPress]);

  return (
    <View style={styles.map}>
      {/* Web: render iframe with Leaflet map */}
      {Platform.OS === 'web' && (
        // @ts-ignore - iframe is supported on web via react-native-web
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%'
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </View>
  );
}

export default function MapHome() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filter, setFilter] = useState<FilterMode>('free');
  const [isListView, setIsListView] = useState(false);
  const [nearestFree, setNearestFree] = useState<Host | null>(null);
  const iframeRef = useRef<any>(null);

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
    if (filter === 'donativo') return h.host_type === 'free' || h.host_type === 'donativo';
    return true;
  });

  const getMarkerColor = (type: string) => {
    const config = hostTypeConfig[type as keyof typeof hostTypeConfig];
    return config?.color ?? colors.ink3;
  };

  const handleHostPress = (hostId: string) => {
    router.push(`/(tabs)/map/host/${hostId}`);
  };

  const handleLocationPress = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API on web
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            // Send message to iframe to center on location
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({
              type: 'center-on-location',
              lat: latitude,
              lng: longitude
            }, '*');
          }, () => {
            // Permission denied or error — silently fail
          });
        }
      } else {
        // Use expo-location on native
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }, 800);
      }
    } catch {
      // Location unavailable — silently fail
    }
  };

  return (
    <View style={styles.container}>
      {/* Map: native or web */}
      {Platform.OS === 'web' ? (
        <WebMapComponent
          hosts={hosts}
          filter={filter}
          onHostPress={handleHostPress}
        />
      ) : (
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
              onPress={() => handleHostPress(host.id)}
            />
          ))}
        </MapView>
      )}

      {/* Top controls overlay */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['free', 'donativo', 'all'] as FilterMode[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              accessibilityLabel={`Filter: ${f === 'free' ? 'Free only' : f === 'donativo' ? 'Free and donativo' : 'All hosts'}`}
              accessibilityState={{ selected: filter === f }}
              accessibilityRole="button"
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
        accessibilityLabel="Center on my location"
        accessibilityRole="button"
        onPress={handleLocationPress}
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
    bottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 16 : 16,
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
