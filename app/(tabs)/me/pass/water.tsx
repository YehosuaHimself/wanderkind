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
const ACCENT = colors.passWater; // #4CA8C9 — cerulean blue
const CARD_WIDTH = 300; // approximate for animation sizing

export default function WaterPassScreen() {
  useAuthGuard();

  const { profile } = useAuth();
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

  // Security line animation: 0 to CARD_WIDTH in 8 seconds, looping
  useEffect(() => {
    Animated.loop(
      Animated.timing(securityLineAnimation, {
        toValue: CARD_WIDTH,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [securityLineAnimation]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I hold the Wanderkind Water Pass — protecting sources, sustaining journeys.`,
        title: `${profile?.trail_name || 'Wanderkind'}'s Water Pass`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const passNumber = generatePassNumber(profile?.id, 'water');
  const waterSources = profile?.water_sources_shared ?? 0;
  const fountainsMarked = profile?.fountains_marked ?? 0;
  const initials = profile?.trail_name
    ? profile.trail_name.split(' ').map((p: string) => p[0]).join('').substring(0, 2).toUpperCase()
    : 'WK';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Water Pass" showBack />

      <View style={styles.pageWrapper}>
        <View style={styles.page}>
          {/* Security Line: vertical moving line */}
          <Animated.View
            style={[
              styles.securityLine,
              { transform: [{ translateX: securityLineAnimation }] },
            ]}
          />

          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]}><View style={styles.bracketH} /><View style={styles.bracketV} /></View>
          <View style={[styles.corner, styles.cornerTR]}><View style={[styles.bracketH, { right: 0 }]} /><View style={[styles.bracketV, { right: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBL]}><View style={[styles.bracketH, { bottom: 0 }]} /><View style={[styles.bracketV, { bottom: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBR]}><View style={[styles.bracketH, { right: 0, bottom: 0 }]} /><View style={[styles.bracketV, { right: 0, bottom: 0 }]} /></View>

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <Animated.View style={[styles.thread, { transform: [{ translateX: textTrackAnimation }] }]}>
              <Text style={styles.threadText}>
                WATER·PASS·SOURCE·FOUNTAIN·STEWARDSHIP·SUSTAIN·WATER·PASS·SOURCE·FOUNTAIN·STEWARDSHIP·SUSTAIN·
              </Text>
            </Animated.View>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Ionicons name="water" size={20} color={ACCENT} />
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Water & Stewardship Pass</Text>
          </View>

          {/* Status Line */}
          <View style={styles.statusLine}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>WATER STEWARD</Text>
            <Text style={styles.passNumberText}>{passNumber}</Text>
          </View>

          {/* Initials Circle - Compressed to 56px */}
          <View style={styles.photoSection}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </View>

          {/* Compact Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SOURCES</Text>
              <Text style={[styles.statValue, waterSources === 0 && styles.statPlaceholder]}>{waterSources || '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>FOUNTAINS</Text>
              <Text style={[styles.statValue, fountainsMarked === 0 && styles.statPlaceholder]}>{fountainsMarked || '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>IMPACT</Text>
              <Text style={[styles.statValue, (waterSources + fountainsMarked) === 0 && styles.statPlaceholder]}>{(waterSources + fountainsMarked) > 0 ? Math.floor((waterSources + fountainsMarked) / 10) : '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={styles.statValue}>{waterSources > 0 ? 'ACTIVE' : 'AWAITING FIRST SOURCE'}</Text>
            </View>
          </View>

          {/* Compact Bio Grid */}
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
              <Text style={styles.bioValue}>STEWARDSHIP</Text>
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

          {/* Shorter Charter */}
          <View style={styles.charterSection}>
            <Text style={styles.charterTitle}>WATER CHARTER</Text>
            <Text style={styles.charterText}>
              Water is life's first gift and the walker's constant companion. Those who map springs and share sources guard something precious — the knowledge that sustains every journey.
            </Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED · STEWARD PROTOCOL · WKD-W</Text>
          </View>

          {/* MRZ Zone */}
          <View style={styles.mrzZone}>
            <Text style={styles.mrzLine}>P{'<'}WKD{(profile?.trail_name || 'UNKNOWN').toUpperCase().padEnd(38, '<')}</Text>
            <Text style={styles.mrzLine}>WATR{'<'.repeat(8)}STEWARDSHIP{'<'.repeat(21)}</Text>
          </View>

          {/* QR Code Section at Bottom */}
          <View style={styles.qrSection}>
            <Ionicons name="qr-code" size={50} color={ACCENT} />
            <Text style={styles.qrText}>SCAN TO VERIFY</Text>
          </View>

          {/* Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerSignature}>Wanderkind Authority</Text>
            <Text style={styles.pageNumber}>WATER PASS · SINGLE PAGE</Text>
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
  pageWrapper: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, justifyContent: 'space-between' },
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
    top: 0,
    left: 0,
    width: 1,
    height: '100%',
    backgroundColor: ACCENT,
    opacity: 0.2,
  },
  corner: { position: 'absolute', width: 20, height: 20, overflow: 'hidden' },
  cornerTL: { top: spacing.md, left: spacing.md },
  cornerTR: { top: spacing.md, right: spacing.md },
  cornerBL: { bottom: spacing.md, left: spacing.md },
  cornerBR: { bottom: spacing.md, right: spacing.md },
  bracketH: { position: 'absolute', width: 16, height: 0.5, backgroundColor: ACCENT, opacity: 0.5 },
  bracketV: { position: 'absolute', width: 0.5, height: 16, backgroundColor: ACCENT, opacity: 0.5 },
  threadContainer: { height: 16, overflow: 'hidden', marginBottom: spacing.sm, justifyContent: 'center' },
  thread: { flexDirection: 'row' },
  threadText: { ...typography.caption, color: ACCENT, opacity: 0.25, letterSpacing: 1, fontSize: 10 },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${ACCENT}4D`,
  },
  embassyTitle: { ...typography.h3, color: ACCENT, letterSpacing: 2, fontWeight: '700', marginTop: spacing.xs, fontSize: 16 },
  embassySubtitle: { ...typography.caption, color: ACCENT, marginTop: 2, opacity: 0.6, fontSize: 10 },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: colors.ink,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: `${ACCENT}33`,
  },
  statLabel: { ...typography.caption, color: ACCENT, opacity: 0.6, marginBottom: 2, letterSpacing: 1, fontSize: 8 },
  statValue: { ...typography.body, color: ACCENT, fontSize: 12, fontWeight: '600' },
  statPlaceholder: { opacity: 0.35 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm, gap: 6 },
  bioField: { width: '47%', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: `${ACCENT}33` },
  bioLabel: { ...typography.monoXs, color: ACCENT, opacity: 0.5, marginBottom: 2, letterSpacing: 1, fontSize: 8 },
  bioValue: { ...typography.body, color: ACCENT, fontWeight: '500', fontSize: 11 },
  charterSection: { marginBottom: spacing.sm },
  charterTitle: { ...typography.caption, color: ACCENT, letterSpacing: 2, marginBottom: spacing.xs, opacity: 0.6, fontSize: 8 },
  charterText: { ...typography.bodySm, color: ACCENT, opacity: 0.5, lineHeight: 16, fontStyle: 'italic', fontSize: 9 },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
  },
  verifiedText: { ...typography.caption, color: colors.green, letterSpacing: 1, fontWeight: '600', fontSize: 9 },
  mrzZone: { backgroundColor: colors.ink, padding: spacing.sm, marginBottom: spacing.sm, borderRadius: radii.sm },
  mrzLine: { fontFamily: 'Courier New', fontSize: 8, color: ACCENT, marginBottom: 2, letterSpacing: 1 },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
  },
  qrText: { ...typography.caption, color: ACCENT, letterSpacing: 1, marginTop: 4, fontSize: 9, opacity: 0.7 },
  pageFooter: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
    gap: 2,
  },
  footerSignature: { ...typography.caption, color: ACCENT, opacity: 0.4, letterSpacing: 1, fontSize: 8 },
  pageNumber: { ...typography.monoXs, color: ACCENT, opacity: 0.3, fontSize: 7 },
  actions: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
