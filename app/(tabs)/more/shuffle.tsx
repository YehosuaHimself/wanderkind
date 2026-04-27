import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/auth';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';

/**
 * SHUFFLE v2 — Personal booking agent.
 *
 * The pilgrim doesn't search. They declare readiness and trust the way.
 *
 * Flow: tap SHUFFLE → profile is broadcast to free/donativo WanderHosts
 * within the chosen radius → first host to accept triggers a confirmation
 * card → walker only has to say yes.
 *
 * Scope: community hosts only (host_type: free | donativo). No paid, no budget.
 * This is Wanderkind-to-WanderHost. Not a booking platform.
 *
 * Persona notes:
 *  - Anna / Maria & Josef: one button, one action, nothing to compare
 *  - Thomas (host, low digital fluency): accepts via his hosting/requests screen
 *  - Sarah (planner): radius picker gives a sense of control
 *  - Lukas (UX critic): no casino gimmick — quiet broadcast + deliberate reveal
 *  - Jakob (scout): the waiting itself feels meaningful, not frustrating
 */

type Radius = 5 | 15 | 30 | 50;
const RADIUS_OPTIONS: Radius[] = [5, 15, 30, 50];
const ACCENT = '#7B2D3F';
const ACCENT_BG = 'rgba(123,45,63,0.06)';

type ShuffleStatus = 'idle' | 'sending' | 'listening' | 'matched' | 'error';

interface ActiveRequest {
  id: string;
  radius_km: number;
  created_at: string;
  expires_at: string;
  status: string;
  matched_host_id?: string | null;
  matched_host_name?: string | null;
  matched_profile_id?: string | null;
  matched_at?: string | null;
}

interface MatchedHost {
  id: string;
  name: string;
  description?: string | null;
  host_type: string;
  amenities: string[];
  lat?: number | null;
  lng?: number | null;
  region?: string | null;
  country?: string | null;
  total_hosted: number;
  rating?: number | null;
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function ShuffleScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const [radius, setRadius] = useState<Radius>(15);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [shuffleStatus, setShuffleStatus] = useState<ShuffleStatus>('idle');
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [matchedHost, setMatchedHost] = useState<MatchedHost | null>(null);
  const [matchedDist, setMatchedDist] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Geolocation (web + native stub)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    }
  }, []);

  const startPulse = useCallback(() => {
    pulse.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.14, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();
  }, [pulse]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulse.setValue(1);
  }, [pulse]);

  // Subscribe to realtime updates on a request row
  const subscribeToRequest = useCallback(
    (requestId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      const ch = supabase
        .channel(`shuffle:${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'shuffle_requests',
            filter: `id=eq.${requestId}`,
          },
          async (payload) => {
            const row = payload.new as ActiveRequest;
            if (row.status === 'matched' && row.matched_host_id) {
              stopPulse();
              const { data: host } = await supabase
                .from('hosts')
                .select(
                  'id, name, description, host_type, amenities, lat, lng, region, country, total_hosted, rating',
                )
                .eq('id', row.matched_host_id)
                .single();
              if (host) {
                setMatchedHost(host as MatchedHost);
                if (coords && host.lat != null && host.lng != null) {
                  setMatchedDist(distanceKm(coords, { lat: host.lat, lng: host.lng }));
                }
              }
              setActiveRequest(row);
              setShuffleStatus('matched');
              haptic.medium();
            }
          },
        )
        .subscribe();
      channelRef.current = ch;
    },
    [coords, stopPulse],
  );

  // On mount: restore any active/matched request for this user
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('shuffle_requests')
        .select('*')
        .eq('requester_id', user.id)
        .in('status', ['pending', 'matched'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return;
      setActiveRequest(data as ActiveRequest);
      setRadius(data.radius_km as Radius);

      if (data.status === 'matched' && data.matched_host_id) {
        const { data: host } = await supabase
          .from('hosts')
          .select(
            'id, name, description, host_type, amenities, lat, lng, region, country, total_hosted, rating',
          )
          .eq('id', data.matched_host_id)
          .single();
        if (host) {
          setMatchedHost(host as MatchedHost);
          if (coords && host.lat != null && host.lng != null) {
            setMatchedDist(distanceKm(coords, { lat: host.lat, lng: host.lng }));
          }
        }
        setShuffleStatus('matched');
      } else {
        setShuffleStatus('listening');
        startPulse();
        subscribeToRequest(data.id);
      }
    })();
    // coords intentionally omitted — runs once on mount with whatever location we have
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      pulseLoop.current?.stop();
    };
  }, []);

  const handleShuffle = useCallback(async () => {
    if (!user || !profile) return;
    haptic.medium();
    setShuffleStatus('sending');
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('shuffle_requests')
      .insert({
        requester_id: user.id,
        trail_name: profile.trail_name,
        nights_walked: profile.nights_walked ?? 0,
        tier: profile.tier ?? 'wanderkind',
        bio: profile.bio ?? null,
        avatar_url: profile.avatar_url ?? null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        radius_km: radius,
      })
      .select()
      .single();

    if (error || !data) {
      setShuffleStatus('error');
      setErrorMsg('Could not send the request. Check your connection and try again.');
      return;
    }

    setActiveRequest(data as ActiveRequest);
    setShuffleStatus('listening');
    startPulse();
    subscribeToRequest(data.id);
  }, [user, profile, coords, radius, startPulse, subscribeToRequest]);

  const handleCancel = useCallback(async () => {
    if (!activeRequest) return;
    haptic.light();
    stopPulse();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    await supabase
      .from('shuffle_requests')
      .update({ status: 'cancelled' })
      .eq('id', activeRequest.id);
    setActiveRequest(null);
    setMatchedHost(null);
    setShuffleStatus('idle');
  }, [activeRequest, stopPulse]);

  const handleAccept = useCallback(() => {
    if (!matchedHost) return;
    haptic.medium();
    router.push(`/(tabs)/map/host/${matchedHost.id}` as any);
  }, [matchedHost, router]);

  const handlePass = useCallback(async () => {
    if (!activeRequest) return;
    haptic.light();
    await supabase
      .from('shuffle_requests')
      .update({ status: 'cancelled' })
      .eq('id', activeRequest.id);
    setActiveRequest(null);
    setMatchedHost(null);
    setMatchedDist(null);
    setShuffleStatus('idle');
  }, [activeRequest]);

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <RouteErrorBoundary routeName="Shuffle">
        <SafeAreaView style={styles.container} edges={['top']}>
          <WKHeader title="Shuffle" showBack />
          <View style={styles.centeredBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="shuffle" size={34} color={ACCENT} />
            </View>
            <Text style={styles.stateTitle}>Become a Wanderkind first</Text>
            <Text style={styles.stateBody}>
              Sign in to let the way connect you with a WanderHost tonight.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/signin' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </RouteErrorBoundary>
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  return (
    <RouteErrorBoundary routeName="Shuffle">
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Shuffle" showBack />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header copy */}
          <View style={styles.headerBlock}>
            <Text style={styles.headline}>Your personal booking agent</Text>
            <Text style={styles.subhead}>
              Say shuffle. Your profile goes out to WanderHosts nearby — free and donativo only.
              When one is ready for you, all you do is say yes.
            </Text>
          </View>

          {/* Radius — only in idle / error */}
          {(shuffleStatus === 'idle' || shuffleStatus === 'error') && (
            <View style={styles.radiusBlock}>
              <Text style={styles.sectionLabel}>SEARCH RADIUS</Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => { haptic.light(); setRadius(r); }}
                    style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.scopeNote}>
                Wanderkind community only — no commercial accommodations.
              </Text>
            </View>
          )}

          {/* State area */}
          <View style={styles.stateArea}>

            {/* IDLE / SENDING */}
            {(shuffleStatus === 'idle' || shuffleStatus === 'sending') && (
              <View style={styles.centeredBlock}>
                <View style={styles.iconCircle}>
                  {shuffleStatus === 'sending'
                    ? <ActivityIndicator color={ACCENT} size="large" />
                    : <Ionicons name="shuffle" size={34} color={ACCENT} />}
                </View>
                <Text style={styles.stateTitle}>
                  {shuffleStatus === 'sending' ? 'Reaching out…' : 'Ready when you are'}
                </Text>
                <Text style={styles.stateBody}>
                  {shuffleStatus === 'sending'
                    ? 'Sending your profile to WanderHosts nearby.'
                    : `Your profile will be shared with WanderHosts within ${radius} km.`}
                </Text>
              </View>
            )}

            {/* LISTENING */}
            {shuffleStatus === 'listening' && (
              <View style={styles.centeredBlock}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <View style={[styles.iconCircle, styles.iconCircleListening]}>
                    <Ionicons name="radio-outline" size={34} color={ACCENT} />
                  </View>
                </Animated.View>
                <Text style={styles.stateTitle}>Listening to the way…</Text>
                <Text style={styles.stateBody}>
                  Your profile has been shared with WanderHosts within{' '}
                  {activeRequest?.radius_km ?? radius} km.{'\n'}
                  You'll see a confirmation here when someone is ready for you.
                </Text>
                <Text style={styles.expiryNote}>Request active for 24 hours</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelLink} activeOpacity={0.6}>
                  <Text style={styles.cancelLinkText}>Cancel request</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MATCHED */}
            {shuffleStatus === 'matched' && matchedHost && (
              <View style={styles.matchedBlock}>
                <View style={styles.matchedBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#22863A" />
                  <Text style={styles.matchedBannerText}>A WanderHost is ready for you</Text>
                </View>

                <View style={styles.resultCard}>
                  <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {matchedHost.host_type === 'free' ? 'Free' : 'Donativo'}
                      </Text>
                    </View>
                    {matchedDist != null && (
                      <Text style={styles.distText}>
                        {matchedDist < 1
                          ? `${Math.round(matchedDist * 1000)} m away`
                          : `${matchedDist.toFixed(1)} km away`}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.resultName}>{matchedHost.name}</Text>
                  {(matchedHost.region || matchedHost.country) && (
                    <Text style={styles.resultLocation}>
                      {[matchedHost.region, matchedHost.country].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {matchedHost.description ? (
                    <Text style={styles.resultDesc} numberOfLines={3}>
                      {matchedHost.description}
                    </Text>
                  ) : null}
                  {Array.isArray(matchedHost.amenities) && matchedHost.amenities.length > 0 && (
                    <View style={styles.amenitiesRow}>
                      {matchedHost.amenities.slice(0, 4).map((a: string) => (
                        <View key={a} style={styles.amenityChip}>
                          <Text style={styles.amenityText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
                      <Ionicons name="footsteps" size={16} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>This feels right</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.passBtn} onPress={handlePass} activeOpacity={0.7}>
                      <Text style={styles.passBtnText}>Pass</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ERROR */}
            {shuffleStatus === 'error' && (
              <View style={styles.centeredBlock}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(200,50,50,0.08)' }]}>
                  <Ionicons name="alert-circle-outline" size={34} color={colors.red} />
                </View>
                <Text style={styles.stateTitle}>Something went wrong</Text>
                <Text style={styles.stateBody}>{errorMsg}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky SHUFFLE button — idle and error states only */}
        {(shuffleStatus === 'idle' || shuffleStatus === 'error') && (
          <View style={styles.stickyWrap}>
            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={handleShuffle}
              activeOpacity={0.85}
              disabled={false}
            >
              <Ionicons name="shuffle" size={20} color="#FFFFFF" />
              <Text style={styles.shuffleBtnText}>SHUFFLE</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  headerBlock: { marginBottom: spacing.xl },
  headline: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 30,
    marginBottom: 8,
  },
  subhead: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 22,
  },

  radiusBlock: { marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.ink3,
    fontWeight: '600',
    marginBottom: 10,
  },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  radiusChipActive: { backgroundColor: ACCENT_BG, borderColor: ACCENT },
  radiusChipText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  radiusChipTextActive: { color: ACCENT },
  scopeNote: { fontSize: 11, color: colors.ink3, fontStyle: 'italic', lineHeight: 16 },

  stateArea: { minHeight: 300 },

  centeredBlock: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 14,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ACCENT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconCircleListening: { backgroundColor: 'rgba(123,45,63,0.12)' },

  stateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 14,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  expiryNote: { fontSize: 11, color: colors.ink3, fontStyle: 'italic' },
  cancelLink: { marginTop: 4, paddingVertical: 4 },
  cancelLinkText: { fontSize: 13, color: colors.ink3, textDecorationLine: 'underline' },

  matchedBlock: { gap: 14 },
  matchedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E7F4EA',
    borderRadius: radii.md,
  },
  matchedBannerText: { fontSize: 13, fontWeight: '700', color: '#22863A' },

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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E7F4EA',
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: '#22863A' },
  distText: { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  resultName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 28,
    marginBottom: 4,
  },
  resultLocation: { fontSize: 13, color: colors.ink3, marginBottom: 12 },
  resultDesc: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 22,
    marginBottom: 16,
  },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
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
  actionsRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  acceptBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderLt,
  },
  passBtnText: { color: colors.ink3, fontSize: 13, fontWeight: '600' },

  stickyWrap: {
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
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: ACCENT,
    paddingVertical: 18,
    borderRadius: radii.md,
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  shuffleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radii.md,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
