import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

const DARK_BG = '#0B0705';
const ACCENT = colors.passFood; // #27864A — deep green

export default function FoodPassScreen() {
  const { profile } = useAuth();
  const textTrackAnimation = useRef(new Animated.Value(0)).current;
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

  const mealsShared = (profile as any)?.meals_shared ?? 0;
  const donativoCount = (profile as any)?.donativo_contributions ?? 0;
  const initials = profile?.trail_name
    ? profile.trail_name.split(' ').map((p: string) => p[0]).join('').substring(0, 2).toUpperCase()
    : 'WK';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Food Pass" showBack />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]}><View style={styles.bracketH} /><View style={styles.bracketV} /></View>
          <View style={[styles.corner, styles.cornerTR]}><View style={[styles.bracketH, { right: 0 }]} /><View style={[styles.bracketV, { right: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBL]}><View style={[styles.bracketH, { bottom: 0 }]} /><View style={[styles.bracketV, { bottom: 0 }]} /></View>
          <View style={[styles.corner, styles.cornerBR]}><View style={[styles.bracketH, { right: 0, bottom: 0 }]} /><View style={[styles.bracketV, { right: 0, bottom: 0 }]} /></View>

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
            <Ionicons name="restaurant" size={24} color={ACCENT} />
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Food & Sustenance Pass</Text>
          </View>

          {/* Status Line */}
          <View style={styles.statusLine}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE CONTRIBUTOR</Text>
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
              <Text style={styles.statLabel}>MEALS SHARED</Text>
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

          {/* Bio Fields */}
          <View style={styles.bioGrid}>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>HOLDER</Text>
              <Text style={styles.bioValue}>{profile?.trail_name || 'Wanderer'}</Text>
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

          {/* Charter */}
          <View style={styles.charterSection}>
            <Text style={styles.charterTitle}>FOOD CHARTER</Text>
            <Text style={styles.charterText}>
              Every meal shared is an act of communion. The Food Pass honours those who nourish fellow wanderers through donativo kitchens, shared tables, and trail provisions.
            </Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED · DONATIVO PROTOCOL · WKD-F</Text>
          </View>

          {/* MRZ Zone */}
          <View style={styles.mrzZone}>
            <Text style={styles.mrzLine}>P{'<'}WKD{(profile?.trail_name || 'UNKNOWN').toUpperCase().padEnd(38, '<')}</Text>
            <Text style={styles.mrzLine}>FOOD{'<'.repeat(8)}SUSTENANCE{'<'.repeat(22)}</Text>
          </View>

          {/* Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerSignature}>Wanderkind Authority</Text>
            <Text style={styles.pageNumber}>FOOD PASS · SINGLE PAGE</Text>
          </View>
        </View>
      </ScrollView>

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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  page: {
    backgroundColor: DARK_BG,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRadius: radii.lg,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 20, height: 20, overflow: 'hidden' },
  cornerTL: { top: spacing.md, left: spacing.md },
  cornerTR: { top: spacing.md, right: spacing.md },
  cornerBL: { bottom: spacing.md, left: spacing.md },
  cornerBR: { bottom: spacing.md, right: spacing.md },
  bracketH: { position: 'absolute', width: 16, height: 0.5, backgroundColor: ACCENT, opacity: 0.5 },
  bracketV: { position: 'absolute', width: 0.5, height: 16, backgroundColor: ACCENT, opacity: 0.5 },
  threadContainer: { height: 20, overflow: 'hidden', marginBottom: spacing.lg, justifyContent: 'center' },
  thread: { flexDirection: 'row' },
  threadText: { ...typography.caption, color: ACCENT, opacity: 0.3, letterSpacing: 1 },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${ACCENT}4D`,
  },
  embassyTitle: { ...typography.h3, color: ACCENT, letterSpacing: 2, fontWeight: '700', marginTop: spacing.sm },
  embassySubtitle: { ...typography.caption, color: ACCENT, marginTop: spacing.xs, opacity: 0.7 },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, opacity: 0.8 },
  statusText: { ...typography.caption, color: colors.green, letterSpacing: 1, fontWeight: '600' },
  photoSection: { alignItems: 'center', marginBottom: spacing.lg },
  initialsCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${ACCENT}26`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
  },
  initialsText: { ...typography.h2, color: ACCENT, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    width: '47%',
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: `${ACCENT}33`,
  },
  statLabel: { ...typography.caption, color: ACCENT, opacity: 0.7, marginBottom: spacing.xs, letterSpacing: 1 },
  statValue: { ...typography.body, color: ACCENT, fontSize: 14, fontWeight: '600' },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg, gap: spacing.md },
  bioField: { width: '47%', paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: `${ACCENT}33` },
  bioLabel: { ...typography.monoXs, color: ACCENT, opacity: 0.6, marginBottom: spacing.xs, letterSpacing: 1 },
  bioValue: { ...typography.body, color: ACCENT, fontWeight: '500' },
  charterSection: { marginBottom: spacing.lg },
  charterTitle: { ...typography.caption, color: ACCENT, letterSpacing: 2, marginBottom: spacing.md, opacity: 0.7 },
  charterText: { ...typography.bodySm, color: ACCENT, opacity: 0.6, lineHeight: 20, fontStyle: 'italic' },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
  },
  verifiedText: { ...typography.caption, color: colors.green, letterSpacing: 1, fontWeight: '600' },
  mrzZone: { backgroundColor: colors.ink, padding: spacing.md, marginBottom: spacing.lg, borderRadius: radii.sm },
  mrzLine: { fontFamily: 'Courier New', fontSize: 9, color: ACCENT, marginBottom: spacing.xs, letterSpacing: 1 },
  pageFooter: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${ACCENT}33`,
    gap: spacing.xs,
  },
  footerSignature: { ...typography.caption, color: ACCENT, opacity: 0.5, letterSpacing: 1 },
  pageNumber: { ...typography.monoXs, color: ACCENT, opacity: 0.4 },
  actions: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
});
