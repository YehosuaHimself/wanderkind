import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { generatePassNumber } from '../../../src/lib/pass-number';
import { QRCode } from '../../../src/components/ui/QRCode';

const DARK_BG = '#0B0705';
const ACCENT = colors.passHosp; // #8B1A2B — deep crimson

export default function HospitalityPassScreen() {
  const _AnimView = Animated.View as any;
  useAuthGuard();

  const { profile } = useAuth();
  const passNumber = generatePassNumber(profile?.id, 'hospitality');
  const textTrackAnimation = useRef(new Animated.Value(0)).current;
  const securityLineAnimation = useRef(new Animated.Value(0)).current;
  const [activeRoute, setActiveRoute] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!profile?.id) return;
      const { data: stamps } = await supabase
        .from('stamps')
        .select('route_id')
        .eq('walker_id', profile.id)
        .not('route_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (stamps?.[0]?.route_id) {
        const { data: route } = await supabase
          .from('routes')
          .select('name')
          .eq('id', stamps[0].route_id)
          .single();
        if (route) setActiveRoute(route.name);
      }
    };
    fetchRoute();
  }, [profile?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(textTrackAnimation, {
        toValue: -1000,
        duration: 22000,
        useNativeDriver: true,
      })
    ).start();
  }, [textTrackAnimation]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(securityLineAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [securityLineAnimation]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I hold the Wanderkind Hospitality Pass — opening doors, building trust.`,
        title: `${profile?.trail_name || 'Wanderkind'}'s Hospitality Pass`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const nightsHosted = profile?.nights_hosted ?? 0;
  const guestsWelcomed = profile?.guests_count ?? 0;
  const hostRating = profile?.hosting_rating ?? 0;
  const initials = profile?.trail_name
    ? profile.trail_name.split(' ').map((p: string) => p[0]).join('').substring(0, 2).toUpperCase()
    : 'WK';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hospitality Pass" showBack />

      <View style={styles.wrapper}>
        <View style={styles.page}>
          {/* Security Line Animation */}
          <_AnimView
            style={[
              styles.securityLine,
              {
                transform: [
                  {
                    translateX: securityLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 320],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]}><View style={styles.bracketH} /><View style={styles.bracketV} /></View>
          <View style={[styles.corner, styles.cornerTR]}><View style={[styles.bracketH, { right: 0 }]} /><View style={[styles.bracketV, { right: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBL]}><View style={[styles.bracketH, { bottom: 0 }]} /><View style={[styles.bracketV, { bottom: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBR]}><View style={[styles.bracketH, { right: 0, bottom: 0 }]} /><View style={[styles.bracketV, { right: 0, bottom: 0 }]} /></View>

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <_AnimView style={[styles.thread, { transform: [{ translateX: textTrackAnimation }] }]}>
              <Text style={styles.threadText}>
                HOSPITALITY·PASS·OPEN·DOOR·WANDERHOST·TRUST·HOSPITALITY·PASS·OPEN·DOOR·WANDERHOST·TRUST·
              </Text>
            </_AnimView>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Ionicons name="home" size={22} color={ACCENT} />
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Hospitality & Shelter Pass</Text>
          </View>

          {/* Status Line */}
          <View style={styles.statusLine}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>VERIFIED WANDERHOST</Text>
            <Text style={styles.passNumberText}>{passNumber}</Text>
          </View>

          {/* Initials Circle */}
          <View style={styles.photoSection}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>NIGHTS HOSTED</Text>
              <Text style={[styles.statValue, nightsHosted === 0 && styles.statPlaceholder]}>{nightsHosted || '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>GUESTS</Text>
              <Text style={[styles.statValue, guestsWelcomed === 0 && styles.statPlaceholder]}>{guestsWelcomed || '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>RATING</Text>
              <Text style={[styles.statValue, hostRating === 0 && styles.statPlaceholder]}>{hostRating > 0 ? hostRating.toFixed(1) : '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={styles.statValue}>{nightsHosted > 0 ? 'ACTIVE' : 'AWAITING FIRST NIGHT'}</Text>
            </View>
          </View>

          {/* Bio Fields */}
          <View style={styles.bioGrid}>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>HOLDER</Text>
              <Text style={styles.bioValue}>{profile?.trail_name || 'Wanderer'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>WK-ID</Text>
              <Text style={styles.bioValue}>{profile?.wanderkind_id || 'WK-0000'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>CLASS</Text>
              <Text style={styles.bioValue}>SHELTER</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>ISSUED</Text>
              <Text style={styles.bioValue}>2026</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>ROUTE</Text>
              <Text style={styles.bioValue}>{activeRoute?.toUpperCase() || 'UNSET'}</Text>
            </View>
          </View>

          {/* Charter */}
          <View style={styles.charterSection}>
            <Text style={styles.charterTitle}>HOSPITALITY CHARTER</Text>
            <Text style={styles.charterText}>
              To open your door to a stranger is the most ancient act of grace. Every roof offered is a shelter for the soul — the sacred duty of hosting lives in those who welcome without condition.
            </Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED · HOST PROTOCOL · WKD-H</Text>
          </View>

          {/* MRZ Zone */}
          <View style={styles.mrzZone}>
            <Text style={styles.mrzLine}>P{'<'}WKD{(profile?.trail_name || 'UNKNOWN').toUpperCase().padEnd(38, '<')}</Text>
            <Text style={styles.mrzLine}>HOSP{'<'.repeat(8)}SHELTER{'<'.repeat(25)}</Text>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <QRCode
              value={`https://wanderkind.travel/verify/${passNumber}?wk=${profile?.wanderkind_id || 'WK-0000'}&type=hospitality`}
              size={50}
              color={ACCENT}
            />
            <Text style={styles.qrText}>SCAN TO VERIFY</Text>
          </View>

          {/* Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerSignature}>Wanderkind Authority</Text>
            <Text style={styles.pageNumber}>HOSPITALITY PASS · SINGLE PAGE</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <WKButton
          title="Share Pass"
          onPress={handleShare}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="share-social" size={16} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  wrapper: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'flex-start', paddingTop: spacing.md },
  page: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  securityLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: ACCENT,
    opacity: 0.25,
    left: 0,
    top: 0,
  },
  corner: { position: 'absolute', width: 16, height: 16, overflow: 'hidden', zIndex: 10 },
  cornerTL: { top: spacing.sm, left: spacing.sm },
  cornerTR: { top: spacing.sm, right: spacing.sm },
  cornerBL: { bottom: spacing.sm, left: spacing.sm },
  cornerBR: { bottom: spacing.sm, right: spacing.sm },
  bracketH: { position: 'absolute', width: 12, height: 0.5, backgroundColor: ACCENT, opacity: 0.5 },
  bracketV: { position: 'absolute', width: 0.5, height: 12, backgroundColor: ACCENT, opacity: 0.5 },
  threadContainer: { height: 16, overflow: 'hidden', marginBottom: spacing.sm, justifyContent: 'center' },
  thread: { flexDirection: 'row' },
  threadText: { ...typography.caption, color: ACCENT, opacity: 0.25, letterSpacing: 0.5, fontSize: 10 },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: `${ACCENT}4D`,
  },
  embassyTitle: { ...typography.h3, color: ACCENT, letterSpacing: 1.5, fontWeight: '700', marginTop: 4, fontSize: 16 },
  embassySubtitle: { ...typography.caption, color: ACCENT, marginTop: 2, opacity: 0.6, fontSize: 9 },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.green, opacity: 0.8 },
  statusText: { ...typography.caption, color: colors.green, letterSpacing: 0.5, fontWeight: '600', fontSize: 8 },
  passNumberText: { ...typography.monoXs, color: ACCENT, opacity: 0.6, letterSpacing: 1, fontSize: 8 },
  photoSection: { alignItems: 'center', marginBottom: spacing.sm },
  initialsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${ACCENT}26`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: `${ACCENT}4D`,
  },
  initialsText: { ...typography.h2, color: ACCENT, fontWeight: '700', fontSize: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: colors.ink,
    padding: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 0.5,
    borderColor: `${ACCENT}33`,
  },
  statLabel: { ...typography.caption, color: ACCENT, opacity: 0.6, marginBottom: 2, letterSpacing: 0.5, fontSize: 7 },
  statValue: { ...typography.body, color: ACCENT, fontSize: 12, fontWeight: '600' },
  statPlaceholder: { opacity: 0.35 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm, gap: 6 },
  bioField: { width: '47%', paddingBottom: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: `${ACCENT}33` },
  bioLabel: { ...typography.monoXs, color: ACCENT, opacity: 0.5, marginBottom: 2, letterSpacing: 0.5, fontSize: 7 },
  bioValue: { ...typography.body, color: ACCENT, fontWeight: '500', fontSize: 11 },
  charterSection: { marginBottom: spacing.sm },
  charterTitle: { ...typography.caption, color: ACCENT, letterSpacing: 1, marginBottom: 4, opacity: 0.6, fontSize: 8 },
  charterText: { ...typography.bodySm, color: ACCENT, opacity: 0.5, lineHeight: 16, fontSize: 9 },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: `${ACCENT}33`,
  },
  verifiedText: { ...typography.caption, color: colors.green, letterSpacing: 0.5, fontWeight: '600', fontSize: 8 },
  mrzZone: { backgroundColor: colors.ink, padding: 6, marginBottom: spacing.sm, borderRadius: radii.sm },
  mrzLine: { fontFamily: 'Courier New', fontSize: 8, color: ACCENT, marginBottom: 2, letterSpacing: 0.5 },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: `${ACCENT}33`,
    gap: 4,
  },
  qrText: { ...typography.caption, color: ACCENT, letterSpacing: 0.5, fontWeight: '600', fontSize: 8 },
  pageFooter: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: `${ACCENT}33`,
    gap: 2,
  },
  footerSignature: { ...typography.caption, color: ACCENT, opacity: 0.4, letterSpacing: 0.5, fontSize: 8 },
  pageNumber: { ...typography.monoXs, color: ACCENT, opacity: 0.3, fontSize: 7 },
  actions: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
