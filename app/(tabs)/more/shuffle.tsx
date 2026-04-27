import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { supabase } from '../../../src/lib/supabase';
import { SEED_HOSTS } from '../../../src/data/seed-hosts';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';

/**
 * SHUFFLE — Let the path lead you.
 *
 * A deliberate moment of trust: pick a single nearby WanderHost at random,
 * present them like serendipity rather than search. The pilgrimage ethos
 * matters here — this is not "find the cheapest hotel". It's "trust the
 * way and see who is there for you tonight".
 *
 * Persona-informed design choices:
 *  - Anna (organic discovery): one result, no list, no pressure to compare
 *  - Marco (gastro backpacker): show host_type + amenities so he knows
 *    if a kitchen / bed / both is on offer
 *  - Sarah (planner): direct path to message the host
 *  - Lukas (UX critic): no dice/casino gimmicks — a quiet pause and a
 *    considered reveal, with real distance + amenities
 *  - Maria & Josef (simple): one big SHUFFLE button, one result, two
 *    obvious actions afterwards
 *  - Jakob (scout): the moment feels earned via the pause animation
 *  - Florian (data): distance shown clearly when geolocation available
 */

type Host = typeof SEED_HOSTS[number];
type Radius = 5 | 15 | 30 | 50;

const RADIUS_OPTIONS: Radius[] = [5, 15, 30, 50];
const SHUFFLE_ACCENT = '#7B2D3F'; // wine — distinct from amber, feels mystical/serendipitous
const SHUFFLE_BG_TINT = 'rgba(123,45,63,0.06)';

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  // Haversine — accurate enough for nearby hosts.
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function priceLabel(host: Host): string {
  if (host.price_range) return host.price_range;
  if (host.host_type === 'free') return 'Free';
  if (host.host_type === 'donativo') return 'Donativo';
  return '—';
}

function priceTone(host: Host): { bg: string; fg: string } {
  if (host.host_type === 'free') return { bg: '#E7F4EA', fg: '#22863A' };
  if (host.host_type === 'donativo') return { bg: '#FFF4E1', fg: '#A85F00' };
  return { bg: colors.surface, fg: colors.ink2 };
}

export default function ShuffleScreen() {
  const router = useRouter();
  const [radius, setRadius] = useState<Radius>(15);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [result, setResult] = useState<Host | null>(null);
  const [resultDistance, setResultDistance] = useState<number | null>(null);
  const [emptyState, setEmptyState] = useState(false);

  // Wiggle animation for the shuffle button while shuffling.
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // === Get geolocation once on mount (web + native handled). ===
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setPermissionAsked(true);
        },
        () => setPermissionAsked(true),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    } else {
      // Native: would use expo-location. For first version on native, fall
      // back to no-location random pick.
      setPermissionAsked(true);
    }
  }, []);

  // === Load hosts: try Supabase, fall back to seed. ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('hosts').select('*').eq('is_available', true);
        if (mounted && data && data.length > 0) {
          setHosts(data as Host[]);
          return;
        }
      } catch {}
      if (mounted) setHosts(SEED_HOSTS as Host[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // === Eligible hosts: filter by radius if we have a location ===
  const eligibleHosts = useMemo(() => {
    if (!coords) return hosts;
    return hosts
      .filter((h) => h.lat != null && h.lng != null)
      .map((h) => ({ host: h, d: distanceKm(coords, { lat: h.lat, lng: h.lng }) }))
      .filter(({ d }) => d <= radius)
      .map(({ host }) => host);
  }, [hosts, coords, radius]);

  const handleShuffle = useCallback(() => {
    if (shuffling) return;
    haptic.medium();
    setEmptyState(false);
    setShuffling(true);

    // Animate: wiggle + fade-out, then reveal.
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(fade, {
      toValue: 0.4,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Quick "thinking" pause so the reveal feels considered, not instant.
    window.setTimeout(() => {
      const candidates = eligibleHosts.length > 0 ? eligibleHosts : hosts;
      // Avoid showing the same host twice in a row when possible.
      let pick = pickRandom(candidates);
      if (pick && result && pick.id === result.id && candidates.length > 1) {
        const others = candidates.filter((h) => h.id !== result.id);
        pick = pickRandom(others) ?? pick;
      }
      if (!pick) {
        setEmptyState(true);
        setResult(null);
        setResultDistance(null);
      } else {
        setResult(pick);
        if (coords && pick.lat != null && pick.lng != null) {
          setResultDistance(distanceKm(coords, { lat: pick.lat, lng: pick.lng }));
        } else {
          setResultDistance(null);
        }
        haptic.light();
      }
      setShuffling(false);
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, 950);
  }, [shuffling, eligibleHosts, hosts, coords, result, spin, fade]);

  const handleAccept = useCallback(() => {
    if (!result) return;
    haptic.medium();
    router.push(`/(tabs)/map/host/${result.id}` as any);
  }, [result, router]);

  const handleMessage = useCallback(() => {
    if (!result) return;
    haptic.light();
    // No dedicated host-message route yet — go to host detail where Message lives.
    router.push(`/(tabs)/map/host/${result.id}` as any);
  }, [result, router]);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <RouteErrorBoundary routeName="Shuffle">
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Shuffle" showBack />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.headline}>Let the path lead you</Text>
            <Text style={styles.subhead}>
              One WanderHost. Not chosen by you, not by us — by the way itself.
              Trust it for tonight.
            </Text>
          </View>

          <View style={styles.radiusBlock}>
            <Text style={styles.radiusLabel}>Within</Text>
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    haptic.light();
                    setRadius(r);
                  }}
                  style={[
                    styles.radiusChip,
                    radius === r && styles.radiusChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      radius === r && styles.radiusChipTextActive,
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!coords && permissionAsked && (
              <Text style={styles.locationHint}>
                Without your location, the radius is just a hint — we'll pick from
                all WanderHosts on the network.
              </Text>
            )}
          </View>

          {/* Result area — either empty, the reveal, or the empty state. */}
          <Animated.View style={[styles.resultArea, { opacity: fade }]}>
            {result && !shuffling ? (
              <View style={styles.resultCard}>
                <View style={styles.resultBadgeRow}>
                  <View
                    style={[
                      styles.priceBadge,
                      { backgroundColor: priceTone(result).bg },
                    ]}
                  >
                    <Text style={[styles.priceBadgeText, { color: priceTone(result).fg }]}>
                      {priceLabel(result)}
                    </Text>
                  </View>
                  {resultDistance != null && (
                    <Text style={styles.distanceText}>
                      {resultDistance < 1
                        ? `${Math.round(resultDistance * 1000)} m away`
                        : `${resultDistance.toFixed(1)} km away`}
                    </Text>
                  )}
                </View>

                <Text style={styles.resultName}>{result.name}</Text>
                {(result.region || result.country) && (
                  <Text style={styles.resultLocation}>
                    {[result.region, result.country].filter(Boolean).join(', ')}
                  </Text>
                )}

                {result.description && (
                  <Text style={styles.resultDescription} numberOfLines={3}>
                    {result.description}
                  </Text>
                )}

                {Array.isArray(result.amenities) && result.amenities.length > 0 && (
                  <View style={styles.amenitiesRow}>
                    {result.amenities.slice(0, 4).map((a: string) => (
                      <View key={a} style={styles.amenityChip}>
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={handleAccept}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="footsteps" size={16} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>This feels right</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={handleMessage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={SHUFFLE_ACCENT} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : emptyState && !shuffling ? (
              <View style={styles.emptyState}>
                <Ionicons name="walk-outline" size={32} color={colors.ink3} />
                <Text style={styles.emptyTitle}>No WanderHosts within {radius} km</Text>
                <Text style={styles.emptyHint}>Try widening the radius — the way provides further out.</Text>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                  <View style={styles.placeholderIcon}>
                    <Ionicons
                      name="shuffle"
                      size={36}
                      color={SHUFFLE_ACCENT}
                    />
                  </View>
                </Animated.View>
                {shuffling ? (
                  <Text style={styles.placeholderText}>Listening to the way…</Text>
                ) : (
                  <Text style={styles.placeholderText}>
                    Ready when you are. Press SHUFFLE.
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Sticky shuffle button at the bottom. */}
        <View style={styles.shuffleButtonWrap}>
          <TouchableOpacity
            style={[styles.shuffleButton, shuffling && { opacity: 0.6 }]}
            onPress={handleShuffle}
            activeOpacity={0.85}
            disabled={shuffling}
          >
            {shuffling ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="shuffle" size={20} color="#FFFFFF" />
                <Text style={styles.shuffleButtonText}>
                  {result ? 'Shuffle again' : 'Shuffle'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120, // room for sticky button
  },
  headerBlock: {
    marginBottom: spacing.xl,
  },
  headline: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 32,
    marginBottom: 8,
  },
  subhead: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 22,
  },
  radiusBlock: {
    marginBottom: spacing.xl,
  },
  radiusLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
    marginBottom: 10,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  radiusChipActive: {
    backgroundColor: SHUFFLE_BG_TINT,
    borderColor: SHUFFLE_ACCENT,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
  },
  radiusChipTextActive: {
    color: SHUFFLE_ACCENT,
  },
  locationHint: {
    fontSize: 12,
    color: colors.ink3,
    marginTop: 10,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  resultArea: {
    minHeight: 320,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 18,
  },
  placeholderIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: SHUFFLE_BG_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.ink3,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: colors.ink3,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  resultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 13,
    color: colors.ink2,
    fontWeight: '600',
  },
  resultName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 28,
    marginBottom: 4,
  },
  resultLocation: {
    fontSize: 13,
    color: colors.ink3,
    marginBottom: 14,
  },
  resultDescription: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 22,
    marginBottom: 16,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  amenityText: {
    fontSize: 11,
    color: colors.ink2,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SHUFFLE_ACCENT,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: SHUFFLE_ACCENT,
    backgroundColor: SHUFFLE_BG_TINT,
  },
  messageBtnText: {
    color: SHUFFLE_ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  shuffleButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: SHUFFLE_ACCENT,
    paddingVertical: 18,
    borderRadius: radii.md,
    shadowColor: SHUFFLE_ACCENT,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  shuffleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
