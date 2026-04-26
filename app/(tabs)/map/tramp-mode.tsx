import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Vibration,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Ride log entry ──────────────────────────────────────────────────
interface RideEntry {
  id: string;
  user_id?: string;
  started_at: string;
  ended_at: string | null;
  driver_note: string;
  rating: 'good' | 'bad' | null;
  distance_km: number | null;
}

export default function TrampMode() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const { profile } = useAuth();

  // ── State ──────────────────────────────────────────────────────────
  const [signalActive, setSignalActive] = useState(false);
  const [rideLog, setRideLog] = useState<RideEntry[]>([]);
  const [currentRide, setCurrentRide] = useState<RideEntry | null>(null);
  const [waitStarted, setWaitStarted] = useState<Date | null>(null);
  const [waitMinutes, setWaitMinutes] = useState(0);
  const [shareLocation, setShareLocation] = useState(true);
  const [showSignalScreen, setShowSignalScreen] = useState(false);
  const [rideEndedAwaitingFeedback, setRideEndedAwaitingFeedback] = useState<RideEntry | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<'good' | 'bad' | null>(null);

  // ── Animations ─────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  if (isLoading) return null;

  useEffect(() => {
    if (signalActive) {
      // Gentle pulse on the W
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      // Glow ring
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.4);
    }
  }, [signalActive]);

  // Load historical rides on mount
  useEffect(() => {
    const loadRides = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load rides:', error);
          return;
        }

        if (data) {
          setRideLog(data as RideEntry[]);
        }
      } catch (err) {
        console.error('Error loading rides:', err);
      }
    };

    loadRides();
  }, [user?.id]);

  // Wait timer
  useEffect(() => {
    if (!waitStarted) return;
    const iv = setInterval(() => {
      setWaitMinutes(Math.floor((Date.now() - waitStarted.getTime()) / 60000));
    }, 10000);
    return () => clearInterval(iv);
  }, [waitStarted]);

  // ── Handlers ───────────────────────────────────────────────────────
  const activateSignal = useCallback(() => {
    setSignalActive(true);
    setWaitStarted(new Date());
    setShowSignalScreen(true);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
  }, []);

  const deactivateSignal = useCallback(() => {
    setSignalActive(false);
    setWaitStarted(null);
    setWaitMinutes(0);
    setShowSignalScreen(false);
  }, []);

  const shareLocationHandler = useCallback(() => {
    // In a real app, you'd get actual GPS coordinates
    // For now, use placeholder or fetch from location service
    const lat = 37.7749; // Example: San Francisco
    const lng = -122.4194;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `I'm hitchhiking near ${lat.toFixed(4)}, ${lng.toFixed(4)}. Track me: ${mapUrl}`;

    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    Linking.openURL(smsUrl).catch(() => {
      // Fallback: try WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      Linking.openURL(whatsappUrl).catch(() => {
        toast.error('Could not open messaging app');
      });
    });
  }, []);

  const startRide = useCallback(() => {
    const ride: RideEntry = {
      id: `ride-${Date.now()}`,
      started_at: new Date().toISOString(),
      ended_at: null,
      driver_note: '',
      rating: null,
      distance_km: null,
    };
    setCurrentRide(ride);
    setShowSignalScreen(false);
    setSignalActive(false);
    setWaitStarted(null);
    toast.success('Ride started. Stay safe out there.');
  }, []);

  const endRide = useCallback(() => {
    if (!currentRide) return;
    const finished: RideEntry = {
      ...currentRide,
      ended_at: new Date().toISOString(),
    };
    // Show feedback screen instead of immediately finishing
    setRideEndedAwaitingFeedback(finished);
    setCurrentRide(null);
    setFeedbackNote('');
    setFeedbackRating(null);
  }, [currentRide]);

  const submitRideFeedback = useCallback(async () => {
    if (!rideEndedAwaitingFeedback || !user?.id) return;
    const finished: RideEntry = {
      ...rideEndedAwaitingFeedback,
      driver_note: feedbackNote,
      rating: feedbackRating,
    };

    // Always add to local state first (fallback)
    setRideLog(prev => [finished, ...prev]);
    setRideEndedAwaitingFeedback(null);

    // Try to save to Supabase
    try {
      const { error } = await supabase
        .from('rides')
        .insert({
          id: finished.id,
          user_id: user.id,
          started_at: finished.started_at,
          ended_at: finished.ended_at,
          driver_note: finished.driver_note,
          rating: finished.rating,
          distance_km: finished.distance_km,
        });

      if (error) {
        console.error('Failed to save ride:', error);
        toast.error('Ride saved locally (network error)');
      } else {
        toast.success('Ride saved');
      }
    } catch (err) {
      console.error('Error saving ride:', err);
      toast.error('Ride saved locally (network error)');
    }
  }, [rideEndedAwaitingFeedback, feedbackNote, feedbackRating, user?.id]);

  // ── Full-screen signal (the core feature) ──────────────────────────
  if (showSignalScreen && signalActive) {
    return (
      <View style={signalStyles.container}>
        <StatusBar barStyle="light-content" />

        {/* Pulsing glow ring */}
        <Animated.View style={[signalStyles.glowRing, { opacity: glowAnim }]} />

        {/* The large W */}
        <Animated.View style={[signalStyles.wContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={signalStyles.wLetter}>W</Text>
        </Animated.View>

        {/* WANDERKIND label */}
        <Text style={signalStyles.brandLabel}>WANDERKIND</Text>

        {/* Wait time */}
        {waitMinutes > 0 && (
          <Text style={signalStyles.waitText}>
            Waiting {waitMinutes} min
          </Text>
        )}

        {/* Trail name so drivers see who you are */}
        {profile?.trail_name && (
          <Text style={signalStyles.trailName}>{profile.trail_name}</Text>
        )}

        {/* Bottom controls */}
        <View style={signalStyles.controls}>
          <TouchableOpacity
            style={signalStyles.gotRideBtn}
            onPress={startRide}
            activeOpacity={0.8}
          >
            <Ionicons name="car-outline" size={22} color={colors.tramp} />
            <Text style={signalStyles.gotRideBtnText}>Got a ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={signalStyles.stopBtn}
            onPress={deactivateSignal}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main settings / dashboard view ─────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hitchhike" showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── Hero: Activate Signal ───────────────────────────── */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconRing}>
              <Text style={styles.heroW}>W</Text>
            </View>
            <Text style={styles.heroTitle}>Hitchhike Signal</Text>
            <Text style={styles.heroSubtitle}>
              Hold your phone up while thumbing a ride. The bright orange screen with the Wanderkind W tells drivers you are a trusted wanderkind.
            </Text>

            <WKButton
              title={signalActive ? 'Signal is Active' : 'Activate Signal'}
              onPress={signalActive ? () => setShowSignalScreen(true) : activateSignal}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.heroBtn}
            />
          </View>

          {/* ── Active Ride Card ────────────────────────────────── */}
          {currentRide && (
            <WKCard variant="gold">
              <View style={styles.rideActiveHeader}>
                <View style={styles.rideDot} />
                <Text style={styles.rideActiveTitle}>Ride in Progress</Text>
              </View>
              <Text style={styles.rideActiveTime}>
                Started {formatTimeSince(currentRide.started_at)}
              </Text>
              <WKButton
                title="Share Location"
                onPress={shareLocationHandler}
                variant="primary"
                size="md"
                fullWidth
                style={{ marginTop: spacing.md }}
              />
              <WKButton
                title="End Ride"
                onPress={endRide}
                variant="secondary"
                size="md"
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </WKCard>
          )}

          {/* ── Ride Feedback ──────────────────────────────────── */}
          {rideEndedAwaitingFeedback && (
            <WKCard variant="gold">
              <Text style={styles.feedbackTitle}>Rate Your Ride</Text>
              <Text style={styles.feedbackSubtitle}>Help keep hitchhiking safe</Text>

              <TextInput
                style={styles.feedbackInput}
                placeholder="Driver name / license plate (optional)"
                placeholderTextColor={colors.ink3}
                value={feedbackNote}
                onChangeText={setFeedbackNote}
                maxLength={100}
              />

              <View style={styles.ratingRow}>
                <TouchableOpacity
                  style={[
                    styles.ratingBtn,
                    feedbackRating === 'good' && styles.ratingBtnActive,
                  ]}
                  onPress={() => setFeedbackRating('good')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="thumbs-up"
                    size={24}
                    color={feedbackRating === 'good' ? colors.green : colors.ink2}
                  />
                  <Text style={[
                    styles.ratingLabel,
                    feedbackRating === 'good' && styles.ratingLabelActive,
                  ]}>Good</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.ratingBtn,
                    feedbackRating === 'bad' && styles.ratingBtnActive,
                  ]}
                  onPress={() => setFeedbackRating('bad')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="thumbs-down"
                    size={24}
                    color={feedbackRating === 'bad' ? colors.red : colors.ink2}
                  />
                  <Text style={[
                    styles.ratingLabel,
                    feedbackRating === 'bad' && styles.ratingLabelActive,
                  ]}>Bad</Text>
                </TouchableOpacity>
              </View>

              <WKButton
                title="Save Ride"
                onPress={submitRideFeedback}
                variant="primary"
                size="md"
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </WKCard>
          )}

          {/* ── Settings ───────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SETTINGS</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Share Location</Text>
                  <Text style={styles.settingDesc}>
                    Let other wanderkinder see you are hitchhiking nearby
                  </Text>
                </View>
                <Switch
                  value={shareLocation}
                  onValueChange={setShareLocation}
                  trackColor={{ false: colors.borderLt, true: `${colors.tramp}40` }}
                  thumbColor={shareLocation ? colors.tramp : colors.ink3}
                />
              </View>
            </View>
          </View>

          {/* ── How It Works ───────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            <View style={styles.stepsCard}>
              <StepRow
                number="1"
                title="Activate the signal"
                desc="Your screen turns into a bright orange beacon with the Wanderkind W."
              />
              <StepRow
                number="2"
                title="Hold your phone up"
                desc="Stand at a good spot with visibility. Drivers see the W and know you are a wanderkind."
              />
              <StepRow
                number="3"
                title="Log your ride"
                desc="Tap 'Got a ride' when a driver stops. Keep a record of your hitchhiking journey."
              />
            </View>
          </View>

          {/* ── Safety Tips ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STAY SAFE</Text>
            <View style={styles.safetyCard}>
              <SafetyTip icon="location-outline" text="Share your live location with someone you trust before hitching." />
              <SafetyTip icon="shield-checkmark-outline" text="Trust your instincts. If something feels off, wait for the next ride." />
              <SafetyTip icon="eye-outline" text="Stand in a visible spot with good sight lines and room for a car to pull over." />
              <SafetyTip icon="moon-outline" text="Avoid hitchhiking after dark. Daylight rides are safer." />
              <SafetyTip icon="chatbubble-outline" text="Tell the driver your destination before getting in. Agree on the route." />
            </View>
          </View>

          {/* ── Ride Log ───────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RIDE LOG</Text>
            {rideLog.length === 0 ? (
              <View style={styles.emptyLog}>
                <Ionicons name="car-outline" size={36} color={colors.ink3} />
                <Text style={styles.emptyLogText}>No rides logged yet</Text>
                <Text style={styles.emptyLogSub}>
                  Your hitchhiking history will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.logList}>
                {rideLog.map(ride => (
                  <View key={ride.id} style={styles.logEntry}>
                    <View style={styles.logDot} />
                    <View style={styles.logContent}>
                      <Text style={styles.logDate}>
                        {new Date(ride.started_at).toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.logDuration}>
                        {formatRideDuration(ride.started_at, ride.ended_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helper components ─────────────────────────────────────────────────

function StepRow({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNum}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function SafetyTip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.safetyRow}>
      <Ionicons name={icon as any} size={18} color={colors.tramp} />
      <Text style={styles.safetyText}>{text}</Text>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatTimeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function formatRideDuration(start: string, end: string | null): string {
  if (!end) return 'In progress';
  const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min ride`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ride`;
}

// ── Signal screen styles ─────────────────────────────────────────────

const signalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tramp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    borderRadius: SCREEN_W * 0.35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  wContainer: {
    width: SCREEN_W * 0.5,
    height: SCREEN_W * 0.5,
    borderRadius: SCREEN_W * 0.25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wLetter: {
    fontSize: SCREEN_W * 0.32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    // Helvetica Neue on iOS, fallback on Android/web
    ...(Platform.OS === 'ios'
      ? { fontFamily: 'Helvetica Neue' }
      : { fontFamily: 'sans-serif' }),
  },
  brandLabel: {
    marginTop: 28,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    color: 'rgba(255,255,255,0.85)',
  },
  waitText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  trailName: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gotRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  gotRideBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.tramp,
  },
  stopBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ── Main view styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  heroIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tramp,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroW: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    ...(Platform.OS === 'ios'
      ? { fontFamily: 'Helvetica Neue' }
      : { fontFamily: 'sans-serif' }),
  },
  heroTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  heroBtn: {
    marginTop: spacing.sm,
  },

  // Active ride
  rideActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  rideActiveTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  rideActiveTime: {
    ...typography.bodySm,
    color: colors.ink2,
  },

  // Sections
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.tramp,
  },

  // Settings
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  settingDesc: {
    ...typography.caption,
    color: colors.ink3,
  },

  // Steps
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.tramp}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.tramp,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  stepDesc: {
    ...typography.caption,
    color: colors.ink2,
    lineHeight: 18,
  },

  // Safety
  safetyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.md,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  safetyText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },

  // Ride log
  emptyLog: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  emptyLogText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyLogSub: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  logList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.tramp,
  },
  logContent: {
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  logDuration: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: 2,
  },

  // Feedback
  feedbackTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  feedbackSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.md,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.borderLt,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ratingBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  ratingBtnActive: {
    borderColor: colors.tramp,
    backgroundColor: `${colors.tramp}08`,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
  },
  ratingLabelActive: {
    color: colors.ink,
  },
});
