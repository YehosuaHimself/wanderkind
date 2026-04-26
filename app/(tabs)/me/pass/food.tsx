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

const DARK_BG = '#0B0705';
const ACCENT = colors.passFood; // #27864A — deep green

export default function FoodPassScreen() {
  useAuthGuard();

  const { profile } = useAuth();
  const textTrackAnimation = useRef(new Animated.Value(0)).current;
  const securityLineAnimation = useRef(new Animated.Value(0)).current;
  const [activeRoute, setActiveRoute] = React.useState<string | null>(null);
  const [cardWidth, setCardWidth] = React.useState(300);

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
        toValue: cardWidth,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [securityLineAnimation, cardWidth]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I hold the Wanderkind Food Pass — sharing meals, sharing life.`,
        title: `${profile?.trail_name || 'Wanderkind'}'s Food Pass`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const passNumber = generatePassNumber(profile?.id, 'food');
  const mealsShared = profile?.meals_shared ?? 0;
  const donativoCount = profile?.donativo_contributions ?? 0;
  const initials = profile?.trail_name
    ? profile.trail_name.split(' ').map((p: string) => p[0]).join('').substring(0, 2).toUpperCase()
    : 'WK';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Food Pass" showBack />

      <View style={styles.contentContainer}>
        <View style={styles.page} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]}><View style={styles.bracketH} /><View style={styles.bracketV} /></View>
          <View style={[styles.corner, styles.cornerTR]}><View style={[styles.bracketH, { right: 0 }]} /><View style={[styles.bracketV, { right: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBL]}><View style={[styles.bracketH, { bottom: 0 }]} /><View style={[styles.bracketV, { bottom: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBR]}><View style={[styles.bracketH, { right: 0, bottom: 0 }]} /><View style={[styles.bracketV, { right: 0, bottom: 0 }]} /></View>

          {/* Security Line - Vertical moving line */}
          <Animated.View style={[styles.securityLine, { transform: [{ translateX: securityLineAnimation }] }]} />

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <Animated.View style={[styles.thread, { transform: [{ translateX: textTrackAnimation }] }]}>
              <Text style={styles.threadText}>
                FOOD·PASS·DONATIVO·SHARED·MEALS·COMMUNITY·FOOD·PASS·DONATIVO·SHARED·MEALS·COMMUNITY·FOOD·PASS·
              </Text>
            </Animated.View>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Ionicons name="restaurant" size={20} color={ACCENT} />
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Food & Sustenance Pass</Text>
          </View>

          {/* Status Line */}
          <View style={styles.statusLine}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
            <Text style={styles.passNumberText}>{passNumber}</Text>
          </View>

          {/* Initials Circle */}
          <View style={styles.photoSection}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </View>

          {/* Stats Grid - 2x2 */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MEALS</Text>
              <Text style={styles.statValue}>{mealsShared}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DONATIVO</Text>
              <Text style={styles.statValue}>{donativoCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MILESTONES</Text>
              <Text style={styles.statValue}>{Math.floor(mealsShared / 10)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={styles.statValue}>ACTIVE</Text>
            </View>
          </View>

          {/* Bio Fields - 2x2 */}
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
              <Text style={styles.bioValue}>SUSTENANCE</Text>
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

          {/* Charter - Shorter */}
          <View style={styles.charterSection}>
            <Text style={styles.charterTitle}>CHARTER</Text>
            <Text style={styles.charterText}>
              To break bread with a stranger is the oldest act of trust. Every shared meal is a bridge between worlds — the donativo spirit lives wherever a table is set with generosity.
            </Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED · DONATIVO</Text>
          </View>

          {/* MRZ Zone - Compact */}
          <View style={styles.mrzZone}>
            <Text style={styles.mrzLine}>P{'<'}WKD{(profile?.trail_name || 'UNKNOWN').toUpperCase().padEnd(30, '<')}</Text>
            <Text style={styles.mrzLine}>FOOD{'<'.repeat(5)}SUSTENANCE{'<'.repeat(15)}</Text>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Ionicons name="qr-code" size={50} color={ACCENT} />
            <Text style={styles.qrText}>SCAN TO VERIFY</Text>
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
  contentContainer: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  page: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 16, height: 16, overflow: 'hidden' },
  cornerTL: { top: spacing.sm, left: spacing.sm },
  cornerTR: { top: spacing.sm, right: spacing.sm },
  cornerBL: { bottom: spacing.sm, left: spacing.sm },
  cornerBR: { bottom: spacing.sm, right: spacing.sm },
  bracketH: { position: 'absolute', width: 12, height: 0.5, backgroundColor: ACCENT, opacity: 0.5 },
  bracketV: { position: 'absolute', width: 0.5, height: 12, backgroundColor: ACCENT, opacity: 0.5 },
  securityLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: ACCENT,
    opacity: 0.4,
    top: 0,
    left: 0,
  },
  threadContainer: { height: 16, overflow: 'hidden', marginBottom: spacing.sm, justifyContent: 'center' },
  thread: { flexDirection: 'row' },
  threadText: { ...typography.caption, color: ACCENT, opacity: 0.2, letterSpacing: 1, fontSize: 10 },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${ACCENT}4D`,
  },
  embassyTitle: { ...typography.h3, color: ACCENT, letterSpacing: 2, fontWeight: '700', marginTop: spacing.xs, fontSize: 14 },
  embassySubtitle: { ...typography.caption, color: ACCENT, marginTop: spacing.xs, opacity: 0.7, fontSize: 10 },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.green, opacity: 0.8 },
  statusText: { ...typography.caption, color: colors.green, letterSpacing: 1, fontWeight: '600', fontSize: 9 },
  passNumberText: { ...typography.monoXs, color: ACCENT, opacity: 0.6, letterSpacing: 1, fontSize: 8 },
  photoSection: { alignItems: 'center', marginBottom: spacing.sm },
  initialsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${ACCENT}26`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
  },
  initialsText: { ...typography.h2, color: ACCENT, fontWeight: '700', fontSize: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: colors.ink,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: `${ACCENT}33`,
  },
  statLabel: { ...typography.caption, color: ACCENT, opacity: 0.7, marginBottom: spacing.xs, letterSpacing: 1, fontSize: 8 },
  statValue: { ...typography.body, color: ACCENT, fontSize: 12, fontWeight: '600' },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm, gap: spacing.sm },
  bioField: { width: '47%', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: `${ACCENT}33` },
  bioLabel: { ...typography.monoXs, color: ACCENT, opacity: 0.6, marginBottom: spacing.xs, letterSpacing: 1, fontSize: 8 },
  bioValue: { ...typography.body, color: ACCENT, fontWeight: '500', fontSize: 11 },
  charterSection: { marginBottom: spacing.sm },
  charterTitle: { ...typography.caption, color: ACCENT, letterSpacing: 2, marginBottom: spacing.xs, opacity: 0.7, fontSize: 9 },
  charterText: { ...typography.bodySm, color: ACCENT, opacity: 0.6, lineHeight: 16, fontStyle: 'italic', fontSize: 9 },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
  },
  verifiedText: { ...typography.caption, color: colors.green, letterSpacing: 1, fontWeight: '600', fontSize: 9 },
  mrzZone: { backgroundColor: colors.ink, padding: spacing.sm, marginBottom: spacing.sm, borderRadius: radii.sm },
  mrzLine: { fontFamily: 'Courier New', fontSize: 8, color: ACCENT, marginBottom: spacing.xs, letterSpacing: 1 },
  qrSection: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
    gap: spacing.xs,
  },
  qrText: { ...typography.caption, color: ACCENT, letterSpacing: 1, fontWeight: '600', fontSize: 9 },
  actions: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
});
