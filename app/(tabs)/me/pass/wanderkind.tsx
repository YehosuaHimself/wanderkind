import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { generatePassNumber } from '../../../src/lib/pass-number';
import { QRCode } from '../../../src/components/ui/QRCode';
import { getPassProgression, getVerificationBadgeText } from '../../../src/lib/pass-progression';

const DARK_BG = '#0B0705';
const DARK_INK = '#1A120A';

// Generate MRZ line from profile data
const generateMRZLine = (surname: string, givenNames: string): [string, string] => {
  const mrz1 = `P<WKD${(surname || 'UNKNOWN').padEnd(44, '<')}`;
  const names = (givenNames || 'UNKNOWN').padEnd(15, '<');
  const mrz2 = `${names}<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`;
  return [mrz1.substring(0, 44), mrz2.substring(0, 44)];
};

// Get user initials from trail_name
const getInitials = (trailName?: string): string => {
  if (!trailName) return 'WK';
  const parts = trailName.split(' ');
  return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
};

export default function WanderkindPassScreen() {
  const _AnimView = Animated.View as any;
  useAuthGuard();

  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const textTrackAnimation = useRef(new Animated.Value(0)).current;
  const securityLineAnimation = useRef(new Animated.Value(0)).current;
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // Header is approximately 50px, actions bar is approximately 70px
  const HEADER_HEIGHT = 50;
  const ACTIONS_HEIGHT = 70;
  const pageHeight = windowHeight - HEADER_HEIGHT - insets.top - insets.bottom - ACTIONS_HEIGHT;

  // Fetch active route from most recent stamp
  useEffect(() => {
    const fetchRoute = async () => {
      if (!profile?.id) return;
      try {
        const { data: stamps, error: stampsError } = await supabase
          .from('stamps')
          .select('route_id')
          .eq('walker_id', profile.id)
          .not('route_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (stampsError) throw stampsError;

        const routeId = stamps?.[0]?.route_id;
        if (!routeId) return;

        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('name')
          .eq('id', routeId)
          .single();

        if (routeError && routeError.code !== 'PGRST116') throw routeError;
        if (route) setActiveRoute(route.name);
      } catch (err) {
        console.error('Failed to fetch active route:', err);
        toast.error('Failed to load route');
      }
    };
    fetchRoute();
  }, [profile?.id]);

  // Animate the kinetic text track
  useEffect(() => {
    Animated.loop(
      Animated.timing(textTrackAnimation, {
        toValue: -1000,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [textTrackAnimation]);

  // Animate the security line
  useEffect(() => {
    Animated.loop(
      Animated.timing(securityLineAnimation, {
        toValue: pageHeight,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [securityLineAnimation, pageHeight]);

  const handleShare = async () => {
    try {
      const trailName = profile?.trail_name || 'Wanderkind';
      await Share.share({
        message: `I'm a verified Wanderkind! Join me on the journey.`,
        title: `${trailName}'s Wanderkind Pass`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const passNumber = generatePassNumber(profile?.id, 'wanderkind');
  const [mrz1, mrz2] = generateMRZLine(profile?.surname || '', profile?.given_names || '');
  const initials = getInitials(profile?.trail_name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Wanderkind Pass" showBack />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        style={[styles.scrollView, { height: pageHeight }]}
        contentContainerStyle={{ width: windowWidth * 2 }}
      >
        {/* PAGE 1: BIO DATA */}
        <View style={[styles.page, { width: windowWidth, height: pageHeight }]}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTopLeft]}>
            <View style={styles.bracketH} />
            <View style={styles.bracketV} />
          </View>
          <View style={[styles.corner, styles.cornerTopRight]}>
            <View style={[styles.bracketH, { right: 0 }]} />
            <View style={[styles.bracketV, { right: 0 }]} />
          </View>
          <View style={[styles.corner, styles.cornerBottomLeft]}>
            <View style={[styles.bracketH, { bottom: 0 }]} />
            <View style={[styles.bracketV, { bottom: 0 }]} />
          </View>
          <View style={[styles.corner, styles.cornerBottomRight]}>
            <View style={[styles.bracketH, { right: 0, bottom: 0 }]} />
            <View style={[styles.bracketV, { right: 0, bottom: 0 }]} />
          </View>

          {/* Security Line Animation */}
          <_AnimView
            style={[
              styles.securityLine,
              {
                transform: [{ translateY: securityLineAnimation }],
              },
            ]}
          />

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <_AnimView
              style={[
                styles.thread,
                {
                  transform: [{ translateX: textTrackAnimation }],
                },
              ]}
            >
              <Text style={styles.threadText}>
                WANDERKIND·EMBASSY·DIGITAL·WANDERKIND·EMBASSY·DIGITAL·WANDERKIND·EMBASSY·DIGITAL·
              </Text>
            </_AnimView>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Text style={styles.hexagon}>⬡</Text>
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Digital Pass</Text>
          </View>

          {/* Status Line */}
          <View style={styles.statusLine}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>READY TO SCAN</Text>
            <Text style={styles.passNumberText}>{passNumber}</Text>
          </View>

          {/* Photo & Initials Circle */}
          <View style={styles.photoSection}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </View>

          {/* Bio Fields Grid */}
          <View style={styles.bioGrid}>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>SURNAME</Text>
              <Text style={styles.bioValue}>{profile?.surname || 'UNKNOWN'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>GIVEN NAME</Text>
              <Text style={styles.bioValue}>{profile?.given_names || 'UNKNOWN'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>DATE OF BIRTH</Text>
              <Text style={styles.bioValue}>{profile?.date_of_birth || '-- -- ----'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>SEX</Text>
              <Text style={styles.bioValue}>{profile?.sex || 'U'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>NATIONALITY</Text>
              <Text style={styles.bioValue}>{profile?.nationality || 'WORLD'}</Text>
            </View>
            <View style={styles.bioField}>
              <Text style={styles.bioLabel}>ROUTE</Text>
              <Text style={styles.bioValue}>{activeRoute?.toUpperCase() || 'UNSET'}</Text>
            </View>
          </View>

          {/* Signature */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <Text style={styles.signatureValue}>{profile?.trail_name || 'Wanderer'}</Text>
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>{profile?.wanderkind_id || 'WK-0000'}</Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED · ED25519 · ICAO 9303</Text>
          </View>

          {/* MRZ Zone */}
          <View style={styles.mrzZone}>
            <Text style={styles.mrzLine}>{mrz1}</Text>
            <Text style={styles.mrzLine}>{mrz2}</Text>
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerSignature}>Wanderkind Authority</Text>
            <Text style={styles.pageNumber}>PAGE 1 / 2</Text>
          </View>
        </View>

        {/* PAGE 2: SECURITY MATRIX */}
        <View style={[styles.page, { width: windowWidth, height: pageHeight }]}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTopLeft]}>
            <View style={styles.bracketH} />
            <View style={styles.bracketV} />
          </View>
          <View style={[styles.corner, styles.cornerTopRight]}>
            <View style={[styles.bracketH, { right: 0 }]} />
            <View style={[styles.bracketV, { right: 0 }]} />
          </View>
          <View style={[styles.corner, styles.cornerBottomLeft]}>
            <View style={[styles.bracketH, { bottom: 0 }]} />
            <View style={[styles.bracketV, { bottom: 0 }]} />
          </View>
          <View style={[styles.corner, styles.cornerBottomRight]}>
            <View style={[styles.bracketH, { right: 0, bottom: 0 }]} />
            <View style={[styles.bracketV, { right: 0, bottom: 0 }]} />
          </View>

          {/* Security Line Animation */}
          <_AnimView
            style={[
              styles.securityLine,
              {
                transform: [{ translateY: securityLineAnimation }],
              },
            ]}
          />

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <_AnimView
              style={[
                styles.thread,
                {
                  transform: [{ translateX: textTrackAnimation }],
                },
              ]}
            >
              <Text style={styles.threadText}>
                SECURITY·MATRIX·CERTIFICATION·SECURITY·MATRIX·CERTIFICATION·SECURITY·MATRIX·CERTIFICATION·
              </Text>
            </_AnimView>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Text style={styles.hexagon}>⬡</Text>
            <Text style={styles.embassyTitle}>Security Matrix</Text>
          </View>

          {/* Security Grid 2x2 */}
          <View style={styles.securityGrid}>
            <View style={styles.securityCard}>
              <Text style={styles.securityLabel}>SHA-256 HASH</Text>
              <Text style={styles.securityValue} numberOfLines={2}>
                a7f4e9c2b1d3...
              </Text>
            </View>
            <View style={styles.securityCard}>
              <Text style={styles.securityLabel}>ISSUER SEAL</Text>
              <Text style={styles.securityValue}>WKD-2026-04</Text>
            </View>
            <View style={styles.securityCard}>
              <Text style={styles.securityLabel}>VALIDITY</Text>
              <Text style={styles.securityValue}>365 DAYS</Text>
            </View>
            <View style={styles.securityCard}>
              <Text style={styles.securityLabel}>DOC AUTH</Text>
              <Text style={styles.securityValue}>ACTIVE</Text>
            </View>
          </View>

          {/* Charter Section */}
          <View style={styles.charterSection}>
            <Text style={styles.charterTitle}>WANDERKIND CHARTER</Text>
            <Text style={styles.charterText}>
              The road is the oldest teacher. To walk is to remember what the body has always known — that transformation begins with a single step, and the journey itself is the destination.
            </Text>
          </View>

          {/* Milestone Badges — PS-07 Visual Progression */}
          {(() => {
            const progression = getPassProgression(
              profile?.nights_walked ?? 0,
              profile?.verification_level ?? 'self'
            );
            if (progression.milestones.length === 0) return null;
            return (
              <View style={styles.milestonesSection}>
                <Text style={styles.milestonesLabel}>MILESTONES</Text>
                <View style={styles.milestonesRow}>
                  {progression.milestones.map((m, i) => (
                    <View key={i} style={styles.milestoneBadge}>
                      <Ionicons name={m.icon as any} size={14} color={m.color} />
                      <Text style={[styles.milestoneText, { color: m.color }]}>{m.label}</Text>
                    </View>
                  ))}
                </View>
                {getVerificationBadgeText(profile?.verification_level ?? 'self') ? (
                  <Text style={styles.verBadgeText}>
                    {getVerificationBadgeText(profile?.verification_level ?? 'self')}
                  </Text>
                ) : null}
              </View>
            );
          })()}

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <QRCode
              value={`https://wanderkind.travel/verify/${passNumber}?wk=${profile?.wanderkind_id || 'WK-0000'}&type=wanderkind`}
              size={60}
              color={colors.amber}
            />
            <Text style={styles.scanText}>SCAN TO VERIFY</Text>
            <Text style={styles.scanUrl}>wanderkind.travel/verify</Text>
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerSignature}>Wanderkind Authority</Text>
            <Text style={styles.pageNumber}>PAGE 2 / 2</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    overflow: 'hidden',
  },
  page: {
    backgroundColor: DARK_BG,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  securityLine: {
    position: 'absolute',
    left: '50%',
    width: 1,
    backgroundColor: colors.amber,
    opacity: 0.15,
    zIndex: 1,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    top: spacing.md,
    left: spacing.md,
  },
  cornerTopRight: {
    top: spacing.md,
    right: spacing.md,
  },
  cornerBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
  },
  cornerBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
  },
  bracketH: {
    position: 'absolute',
    width: 16,
    height: 0.5,
    backgroundColor: colors.amber,
    opacity: 0.5,
  },
  bracketV: {
    position: 'absolute',
    width: 0.5,
    height: 16,
    backgroundColor: colors.amber,
    opacity: 0.5,
  },
  threadContainer: {
    height: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  thread: {
    flexDirection: 'row',
  },
  threadText: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.3,
    letterSpacing: 0.5,
    fontSize: 9,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.amber}4D`,
  },
  hexagon: {
    fontSize: 20,
    color: colors.amber,
    marginBottom: spacing.xs,
  },
  embassyTitle: {
    fontSize: 16,
    color: colors.amber,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  embassySubtitle: {
    fontSize: 10,
    color: colors.amber,
    marginTop: spacing.xs,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
    opacity: 0.8,
  },
  statusText: {
    fontSize: 9,
    color: colors.green,
    letterSpacing: 1,
    fontWeight: '600',
  },
  passNumberText: {
    fontSize: 9,
    color: colors.amber,
    fontFamily: 'Courier New',
    letterSpacing: 1.5,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  initialsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.amber}26`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.amber}4D`,
  },
  initialsText: {
    fontSize: 24,
    color: colors.amber,
    fontWeight: '700',
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  bioField: {
    width: '48%',
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: `${colors.amber}33`,
  },
  bioLabel: {
    fontSize: 7,
    color: colors.amber,
    opacity: 0.6,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  bioValue: {
    fontSize: 11,
    color: colors.amber,
    fontWeight: '500',
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: `${colors.amber}33`,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.amber,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  signatureValue: {
    fontSize: 11,
    color: colors.amber,
    marginTop: spacing.xs,
  },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: `${colors.amber}33`,
  },
  verifiedText: {
    fontSize: 8,
    color: colors.green,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  mrzZone: {
    backgroundColor: colors.ink,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radii.sm,
  },
  mrzLine: {
    fontFamily: 'Courier New',
    fontSize: 8,
    color: colors.amber,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  pageFooter: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: `${colors.amber}33`,
    gap: 2,
  },
  footerSignature: {
    fontSize: 8,
    color: colors.amber,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.amber,
    opacity: 0.4,
    letterSpacing: 0.5,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  securityCard: {
    width: '48%',
    backgroundColor: colors.ink,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 0.5,
    borderColor: `${colors.amber}33`,
  },
  securityLabel: {
    fontSize: 7,
    color: colors.amber,
    opacity: 0.7,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  securityValue: {
    fontSize: 10,
    color: colors.amber,
  },
  charterSection: {
    marginBottom: spacing.md,
  },
  charterTitle: {
    fontSize: 9,
    color: colors.amber,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    opacity: 0.7,
    fontWeight: '600',
  },
  charterText: {
    fontSize: 10,
    color: colors.amber,
    opacity: 0.6,
    lineHeight: 16,
  },
  charterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  charterCell: {
    width: '48%',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: `${colors.amber}33`,
  },
  charterLabel: {
    fontSize: 7,
    color: colors.amber,
    opacity: 0.6,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  charterValue: {
    fontSize: 11,
    color: colors.amber,
  },
  milestonesSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: `${colors.amber}33`,
  },
  milestonesLabel: {
    fontSize: 7,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 8,
  },
  milestonesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,160,23,0.2)',
  },
  milestoneText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verBadgeText: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.amber,
    fontWeight: '600',
    opacity: 0.5,
    marginTop: 8,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: `${colors.amber}33`,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: colors.ink,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 0.5,
    borderColor: `${colors.amber}4D`,
  },
  scanText: {
    fontSize: 9,
    color: colors.amber,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  scanUrl: {
    fontSize: 8,
    color: colors.amber,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
