import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { Route, Host } from '../../../../src/types/database';
import { SEED_ROUTES } from '../../../../src/data/seed-routes';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useAuth } from '../../../../src/stores/auth';
import { toast } from '../../../../src/lib/toast';
import { haptic } from '../../../../src/lib/haptics';

/** Approximate center coords for map overview — derived from first country */
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Spain': { lat: 40.4, lng: -3.7, zoom: 6 },
  'France': { lat: 46.6, lng: 2.3, zoom: 6 },
  'Italy': { lat: 42.5, lng: 12.5, zoom: 6 },
  'Germany': { lat: 51.2, lng: 10.4, zoom: 6 },
  'Portugal': { lat: 39.4, lng: -8.2, zoom: 7 },
  'Switzerland': { lat: 46.8, lng: 8.2, zoom: 8 },
  'Austria': { lat: 47.5, lng: 14.6, zoom: 7 },
  'England': { lat: 52.3, lng: -1.2, zoom: 7 },
  'Japan': { lat: 36.2, lng: 138.3, zoom: 6 },
  'Nepal': { lat: 28.4, lng: 84.1, zoom: 7 },
  'Peru': { lat: -13.5, lng: -72.0, zoom: 7 },
  'Turkey': { lat: 39.9, lng: 32.9, zoom: 6 },
  'New Zealand': { lat: -41.3, lng: 174.8, zoom: 6 },
  'Norway': { lat: 60.5, lng: 8.5, zoom: 5 },
  'Iceland': { lat: 64.9, lng: -19.0, zoom: 6 },
  'Morocco': { lat: 31.6, lng: -7.1, zoom: 7 },
  'Tanzania': { lat: -6.4, lng: 35.7, zoom: 7 },
  'Chile': { lat: -33.4, lng: -70.7, zoom: 6 },
  'Palestine': { lat: 31.9, lng: 35.2, zoom: 8 },
};

function getRouteCenter(countries: string[]): { lat: number; lng: number; zoom: number } {
  for (const c of countries) {
    if (COUNTRY_COORDS[c]) return COUNTRY_COORDS[c];
  }
  return { lat: 46.0, lng: 4.0, zoom: 5 };
}

/** Card background colors — cycling through earthy tones (same as list) */
const CARD_COLORS = [
  '#4A5D3A', '#2C3E50', '#6B5A3E', '#5B3A29',
  '#3D5C5C', '#4A3728', '#2D4A3E', '#5C4033',
];

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#27864A';
    case 'moderate': return '#C8762A';
    case 'challenging': return '#C0392B';
    case 'expert': return '#8E44AD';
    default: return colors.ink3;
  }
};

const getDifficultyLabel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'Easy walking — suitable for beginners';
    case 'moderate': return 'Moderate challenge — some fitness required';
    case 'challenging': return 'Challenging terrain — experienced walkers';
    case 'expert': return 'Expert — multi-week expedition, high endurance';
    default: return difficulty;
  }
};

/** Walker reflections / quotes for the Way */
const WALKER_QUOTES: Record<string, { text: string; walker: string }> = {
  'route-koenigsweg-grand': {
    text: 'The Alps teach you what matters. Four months of walking and I still dream about those mornings.',
    walker: 'A walker from Munich',
  },
  'route-camino-frances': {
    text: 'The Meseta broke me open. Not the mountains, not the rain — the silence. That vast, golden silence.',
    walker: 'A walker from São Paulo',
  },
  'route-camino-portugues': {
    text: 'Porto to Santiago along the coast — the Atlantic wind walks with you the entire way.',
    walker: 'A walker from Amsterdam',
  },
};

const DEFAULT_QUOTE = {
  text: 'Every step on this way carries the footprints of those who walked before you.',
  walker: 'A Wanderkind',
};

export default function WayDetail() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const [way, setWay] = useState<Route | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorIdx, setColorIdx] = useState(0);
  const [transportMode, setTransportMode] = useState<'walking' | 'cycling'>('walking');

  useEffect(() => {
    fetchWayDetail();
  }, [id]);

  const fetchWayDetail = async () => {
    try {
      const { data: wayData } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (wayData) {
        setWay(wayData as Route);
      } else {
        // Fallback to seed data
        const seed = SEED_ROUTES.find(r => r.id === id);
        if (seed) setWay(seed as unknown as Route);
      }

      // Fetch hosts on this route
      const { data: hostsData } = await supabase
        .from('hosts')
        .select('*')
        .eq('route_id', id)
        .limit(10);

      if (hostsData) setHosts(hostsData as Host[]);
    } catch (err) {
      console.error('Failed to fetch way:', err);
      // Fallback to seed
      const seed = SEED_ROUTES.find(r => r.id === id);
      if (seed) setWay(seed as unknown as Route);
    } finally {
      setLoading(false);
    }
  };

  // Determine card color from route index in seed data
  useEffect(() => {
    if (way) {
      const idx = SEED_ROUTES.findIndex(r => r.id === way.id);
      setColorIdx(idx >= 0 ? idx : 0);
    }
  }, [way]);

  const handleStartWay = async () => {
    if (!user?.id || !way) return;
    haptic.heavy();
    try {
      await supabase
        .from('profiles')
        .update({ current_way: way.id })
        .eq('id', user.id);
      haptic.success();
      toast.success(`You are now walking ${way.name}`);
      router.back();
    } catch {
      toast.error('Could not start this way');
    }
  };

  const bgColor = CARD_COLORS[colorIdx % CARD_COLORS.length];
  const quote = way ? (WALKER_QUOTES[way.id] || DEFAULT_QUOTE) : DEFAULT_QUOTE;
  const isCurrentWay = profile?.current_way === way?.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!way) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={styles.notFound}>Way not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{way.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ═══ HERO IMAGE + CARD ═══ */}
        <View style={[styles.heroCard, { backgroundColor: bgColor }]}>
          {way.hero_image ? (
            <Image source={{ uri: way.hero_image }} style={styles.heroImage} resizeMode="cover" />
          ) : null}
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>{way.name}</Text>
            <Text style={styles.heroCountries}>{way.countries.join(' · ')}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{way.distance_km.toLocaleString()}</Text>
                <Text style={styles.statLabel}>KM</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {transportMode === 'cycling' ? Math.max(Math.ceil(way.duration_days / 3), 2) : way.duration_days}
                </Text>
                <Text style={styles.statLabel}>{transportMode === 'cycling' ? 'DAYS (BIKE)' : 'STAGES'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{way.free_host_count}</Text>
                <Text style={styles.statLabel}>FREE HOSTS</Text>
              </View>
            </View>

            {/* Walker Reflection */}
            <View style={styles.quoteSection}>
              <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.quoteText}>"{quote.text}"</Text>
              <Text style={styles.quoteWalker}>— {quote.walker}</Text>
            </View>
          </View>
        </View>

        {/* ═══ START THIS WAY CTA ═══ */}
        <TouchableOpacity
          style={[styles.startBtn, isCurrentWay && styles.startBtnActive]}
          onPress={handleStartWay}
          activeOpacity={0.85}
          disabled={isCurrentWay}
        >
          <Ionicons
            name={isCurrentWay ? 'checkmark-circle' : 'navigate'}
            size={20}
            color={isCurrentWay ? colors.green : '#FFFFFF'}
          />
          <Text style={[styles.startBtnText, isCurrentWay && { color: colors.green }]}>
            {isCurrentWay ? 'You Are Walking This Way' : 'Start This Way'}
          </Text>
        </TouchableOpacity>

        {/* ═══ TRANSPORT MODE TOGGLE ═══ */}
        <View style={styles.transportToggle}>
          <TouchableOpacity
            style={[styles.transportOption, transportMode === 'walking' && styles.transportOptionActive]}
            onPress={() => setTransportMode('walking')}
            activeOpacity={0.7}
          >
            <Ionicons name="walk-outline" size={18} color={transportMode === 'walking' ? '#fff' : colors.ink3} />
            <Text style={[styles.transportLabel, transportMode === 'walking' && styles.transportLabelActive]}>Walking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.transportOption, transportMode === 'cycling' && styles.transportOptionActive]}
            onPress={() => setTransportMode('cycling')}
            activeOpacity={0.7}
          >
            <Ionicons name="bicycle-outline" size={18} color={transportMode === 'cycling' ? '#fff' : colors.ink3} />
            <Text style={[styles.transportLabel, transportMode === 'cycling' && styles.transportLabelActive]}>Cycling</Text>
          </TouchableOpacity>
        </View>

        {transportMode === 'cycling' && (
          <View style={styles.cyclingNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.amber} />
            <Text style={styles.cyclingNoteText}>
              Estimated cycling duration: ~{Math.max(Math.ceil(way.duration_days / 3), 2)} days. Check local regulations — some trail sections may restrict cycling.
            </Text>
          </View>
        )}

        {/* ═══ ABOUT THIS WAY ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT THIS WAY</Text>
          <Text style={styles.description}>{way.description}</Text>
        </View>

        {/* ══��� MAP OVERVIEW ═══ */}
        {Platform.OS === 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MAP OVERVIEW</Text>
            <View style={styles.mapContainer}>
              {(() => {
                const center = getRouteCenter(way.countries);
                const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}</style></head><body><div id="m"></div><script>var map=L.map('m',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false}).setView([${center.lat},${center.lng}],${center.zoom});L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);L.marker([${center.lat},${center.lng}],{icon:L.divIcon({html:'<div style="background:#C8762A;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">W</div>',className:'',iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map);<\/script></body></html>`;
                return (
                  <iframe
                    srcDoc={mapHtml}
                    style={{ width: '100%', height: 180, border: 'none', borderRadius: 12 } as any}
                    title="Route map overview"
                  />
                );
              })()}
            </View>
          </View>
        )}

        {/* ═══ COUNTRIES ═���═ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COUNTRIES</Text>
          <View style={styles.countriesRow}>
            {way.countries.map(c => (
              <View key={c} style={styles.countryChip}>
                <Ionicons name="flag-outline" size={12} color={colors.amber} />
                <Text style={styles.countryText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ DIFFICULTY ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIFFICULTY</Text>
          <View style={[styles.difficultyBox, { borderLeftColor: getDifficultyColor(way.difficulty) }]}>
            <Text style={[styles.difficultyName, { color: getDifficultyColor(way.difficulty) }]}>
              {way.difficulty.charAt(0).toUpperCase() + way.difficulty.slice(1)}
            </Text>
            <Text style={styles.difficultyDesc}>{getDifficultyLabel(way.difficulty)}</Text>
          </View>
        </View>

        {/* ═══ HIGHLIGHTS ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HIGHLIGHTS</Text>
          <View style={styles.highlightsList}>
            <HighlightItem icon="walk-outline" text={`${way.distance_km.toLocaleString()} km across ${way.countries.length} ${way.countries.length === 1 ? 'country' : 'countries'}`} />
            <HighlightItem icon="people-outline" text={`${way.walker_count.toLocaleString()} walkers have completed this way`} />
            <HighlightItem icon="home-outline" text={`${way.host_count} hosts along the route, ${way.free_host_count} free`} />
            <HighlightItem icon="calendar-outline" text={`Typically ${way.duration_days} days to complete`} />
          </View>
        </View>

        {/* ═══ HOSTS ALONG THE WAY ═══ */}
        {hosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOSTS ALONG THE WAY</Text>
            {hosts.slice(0, 4).map(host => (
              <View key={host.id} style={styles.hostCard}>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>{host.name}</Text>
                  <View style={styles.hostMeta}>
                    {host.is_available && (
                      <View style={styles.availableBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.green} />
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                    <Text style={styles.hostType}>{host.host_type?.toUpperCase()}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              </View>
            ))}
            {hosts.length > 4 && (
              <Text style={styles.moreHosts}>+{hosts.length - 4} more hosts on this way</Text>
            )}
          </View>
        )}

        {/* ═══ FURTHER INFO ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FURTHER INFORMATION</Text>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={colors.amber} />
            <Text style={styles.infoText}>
              Wanderkind connects you with hosts along {way.name}. Your Pass and stamps track your journey.
              Each host you stay with adds a stamp to your collection — building trust as you walk.
            </Text>
          </View>
          {way.gpx_url && (
            <View style={[styles.infoCard, { marginTop: 8 }]}>
              <Ionicons name="map-outline" size={18} color={colors.green} />
              <Text style={styles.infoText}>
                GPX track available for offline navigation. Download it to your device before you start.
              </Text>
            </View>
          )}
        </View>

        {/* ═══ BOTTOM CTA ═══ */}
        <View style={styles.bottomCta}>
          <TouchableOpacity
            style={[styles.startBtn, styles.startBtnLarge, isCurrentWay && styles.startBtnActive]}
            onPress={handleStartWay}
            activeOpacity={0.85}
            disabled={isCurrentWay}
          >
            <Ionicons
              name={isCurrentWay ? 'checkmark-circle' : 'navigate'}
              size={22}
              color={isCurrentWay ? colors.green : '#FFFFFF'}
            />
            <Text style={[styles.startBtnText, styles.startBtnTextLarge, isCurrentWay && { color: colors.green }]}>
              {isCurrentWay ? 'You Are Walking This Way' : 'Start This Way'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.bottomNote}>
            This will set {way.name} as your active way on your profile and passes.
          </Text>

          {/* Share on Social */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => router.push({
              pathname: '/(tabs)/more/social-share' as any,
              params: {
                type: 'way',
                wayName: way.name,
                wayImage: way.hero_image || '',
                countries: way.countries.join(', '),
                days: String(way.duration_days),
              },
            })}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.amber} />
            <Text style={styles.shareBtnText}>Share on Social Media</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Small highlight row component */
function HighlightItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.highlightRow}>
      <Ionicons name={icon as any} size={16} color={colors.amber} />
      <Text style={styles.highlightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  headerSpacer: { width: 28 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { ...typography.bodySm, color: colors.ink3 },
  scrollContent: { paddingBottom: 20 },

  // ��── Hero Card ───
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
    minHeight: 260,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as any,
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 22,
    justifyContent: 'flex-end' as const,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // ─── Map Container ──��
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  heroCountries: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  quoteSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 14,
    gap: 6,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },
  quoteWalker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },

  // ─── Start CTA ───
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.amber,
  },
  startBtnActive: {
    backgroundColor: colors.greenBg,
    borderWidth: 1,
    borderColor: colors.green,
  },
  startBtnLarge: {
    height: 54,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startBtnTextLarge: {
    fontSize: 16,
  },

  // ─── Sections ───
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
  },

  // ─── Countries ───
  countriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  countryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },

  // ─── Difficulty ───
  difficultyBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  difficultyName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  difficultyDesc: {
    fontSize: 12,
    color: colors.ink2,
    lineHeight: 17,
  },

  // ─── Highlights ───
  highlightsList: {
    gap: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightText: {
    fontSize: 13,
    color: colors.ink,
    flex: 1,
    lineHeight: 18,
  },

  // ─── Hosts ───
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  hostInfo: { flex: 1 },
  hostName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
  },
  hostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  availableText: {
    fontSize: 10,
    color: colors.green,
    fontWeight: '500',
  },
  hostType: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.amber,
    fontWeight: '600',
  },
  moreHosts: {
    fontSize: 12,
    color: colors.ink3,
    marginTop: 6,
    fontWeight: '500',
  },

  // ─── Info Card ───
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.amber}10`,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: colors.ink2,
    flex: 1,
    lineHeight: 18,
  },

  // ─── Bottom CTA ───
  bottomCta: {
    marginTop: 32,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  bottomNote: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  // Transport mode toggle
  transportToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginTop: 16,
    gap: 4,
  },
  transportOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  transportOptionActive: {
    backgroundColor: colors.amber,
  },
  transportLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink3,
  },
  transportLabelActive: {
    color: '#fff',
  },
  cyclingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  cyclingNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.ink2,
    lineHeight: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.amberLine,
    backgroundColor: colors.surface,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber,
  },
});
