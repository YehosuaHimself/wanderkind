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
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

const DARK_BG = '#0B0705';
const DARK_INK = '#1A120A';

// Generate pass number from user ID
const generatePassNumber = (userId?: string): string => {
  if (!userId) return 'C4X8R2M7';
  const hash = userId.substring(0, 8).toUpperCase();
  let result = '';
  for (let i = 0; i < hash.length; i++) {
    result += i % 2 === 0 ? hash[i] : Math.random() > 0.5 ? hash[i] : String(Math.floor(Math.random() * 10));
  }
  return result.substring(0, 8);
};

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
  const { profile } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const textTrackAnimation = useRef(new Animated.Value(0)).current;

  // Animate the kinetic text track
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(textTrackAnimation, {
          toValue: -1000,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [textTrackAnimation]);

  const handleShare = async () => {
    try {
      const trailName = profile?.trail_name || 'Wanderkind';
      await Share.share({
        message: `I'm a verified Wanderkind! Join me on the pilgrimage.`,
        title: `${trailName}'s Wanderkind Pass`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const passNumber = generatePassNumber(profile?.id);
  const [mrz1, mrz2] = generateMRZLine(profile?.surname || '', profile?.given_names || '');
  const initials = getInitials(profile?.trail_name);
  const passWidth = Dimensions.get('window').width - 2 * spacing.lg;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Wanderkind Pass" showBack />

      <ScrollView
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        style={styles.scrollView}
        contentContainerStyle={{ width: passWidth * 2 }}
      >
        {/* PAGE 1: BIO DATA */}
        <View style={[styles.page, { width: passWidth }]}>
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

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <Animated.View
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
            </Animated.View>
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
              <Text style={styles.bioLabel}>STATUS</Text>
              <Text style={styles.bioValue}>ACTIVE</Text>
            </View>
          </View>

          {/* Signature */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <Text style={styles.signatureValue}>{profile?.trail_name || 'Wanderer'}</Text>
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
        <View style={[styles.page, { width: passWidth }]}>
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

          {/* Kinetic Text Track */}
          <View style={styles.threadContainer}>
            <Animated.View
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
            </Animated.View>
          </View>

          {/* Embassy Header */}
          <View style={styles.headerSection}>
            <Text style={styles.hexagon}>⬡</Text>
            <Text style={styles.embassyTitle}>Wanderkind Embassy</Text>
            <Text style={styles.embassySubtitle}>Security Matrix</Text>
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
            <View style={styles.charterGrid}>
              <View style={styles.charterCell}>
                <Text style={styles.charterLabel}>BASIS</Text>
                <Text style={styles.charterValue}>Pilgrimage</Text>
              </View>
              <View style={styles.charterCell}>
                <Text style={styles.charterLabel}>MOVEMENT</Text>
                <Text style={styles.charterValue}>Open Path</Text>
              </View>
              <View style={styles.charterCell}>
                <Text style={styles.charterLabel}>JURISDICTION</Text>
                <Text style={styles.charterValue}>Global</Text>
              </View>
              <View style={styles.charterCell}>
                <Text style={styles.charterLabel}>IMMUNITIES</Text>
                <Text style={styles.charterValue}>Hospitality</Text>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={60} color={colors.amber} />
            </View>
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
    flex: 1,
  },
  page: {
    backgroundColor: DARK_BG,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    position: 'relative',
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
    height: 20,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  thread: {
    flexDirection: 'row',
  },
  threadText: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.3,
    letterSpacing: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.amber}4D`,
  },
  hexagon: {
    fontSize: 24,
    color: colors.amber,
    marginBottom: spacing.xs,
  },
  embassyTitle: {
    ...typography.h3,
    color: colors.amber,
    letterSpacing: 2,
    fontWeight: '700',
  },
  embassySubtitle: {
    ...typography.caption,
    color: colors.amber,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    opacity: 0.8,
  },
  statusText: {
    ...typography.caption,
    color: colors.green,
    letterSpacing: 1,
    fontWeight: '600',
  },
  passNumberText: {
    ...typography.caption,
    color: colors.amber,
    fontFamily: 'Courier New',
    letterSpacing: 2,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  initialsCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.amber}26`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.amber}4D`,
  },
  initialsText: {
    ...typography.h2,
    color: colors.amber,
    fontWeight: '700',
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  bioField: {
    width: '48%',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.amber}33`,
  },
  bioLabel: {
    ...typography.monoXs,
    color: colors.amber,
    opacity: 0.6,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  bioValue: {
    ...typography.body,
    color: colors.amber,
    fontWeight: '500',
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.amber}33`,
  },
  signatureLabel: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.5,
  },
  signatureValue: {
    ...typography.body,
    color: colors.amber,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  verifiedBadge: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${colors.amber}33`,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.green,
    letterSpacing: 1,
    fontWeight: '600',
  },
  mrzZone: {
    backgroundColor: colors.ink,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radii.sm,
  },
  mrzLine: {
    fontFamily: 'Courier New',
    fontSize: 10,
    color: colors.amber,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  pageFooter: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${colors.amber}33`,
    gap: spacing.xs,
  },
  footerSignature: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.5,
    letterSpacing: 1,
  },
  pageNumber: {
    ...typography.monoXs,
    color: colors.amber,
    opacity: 0.4,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  securityCard: {
    width: '48%',
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: `${colors.amber}33`,
  },
  securityLabel: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.7,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  securityValue: {
    ...typography.body,
    color: colors.amber,
    fontSize: 12,
  },
  charterSection: {
    marginBottom: spacing.lg,
  },
  charterTitle: {
    ...typography.caption,
    color: colors.amber,
    letterSpacing: 2,
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  charterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  charterCell: {
    width: '48%',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.amber}33`,
  },
  charterLabel: {
    ...typography.caption,
    color: colors.amber,
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  charterValue: {
    ...typography.body,
    color: colors.amber,
    fontSize: 14,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${colors.amber}33`,
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.ink,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.amber}4D`,
  },
  scanText: {
    ...typography.caption,
    color: colors.amber,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  scanUrl: {
    ...typography.monoXs,
    color: colors.amber,
    opacity: 0.6,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
