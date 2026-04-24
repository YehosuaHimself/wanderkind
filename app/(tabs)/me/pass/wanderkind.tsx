import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

export default function WanderkindPassScreen() {
  const { profile } = useAuth();

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

  const tierColor = tierColors[profile?.tier || 'wanderkind'] || colors.ink3;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Wanderkind Pass" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Diplomatic Pass Style Card */}
        <WKCard variant="parchment" style={styles.passCard}>
          {/* Header */}
          <View style={styles.passHeader}>
            <Text style={styles.embassy}>WANDERKIND</Text>
            <Text style={styles.embassySubtitle}>PILGRIM CREDENTIAL</Text>
          </View>

          {/* QR Code Area */}
          <View style={styles.qrArea}>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={80} color={colors.amber} />
            </View>
          </View>

          {/* Personal Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>TRAIL NAME</Text>
              <Text style={styles.infoValue}>{profile?.trail_name || 'Wanderer'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>TIER</Text>
              <Text style={[styles.infoValue, { color: tierColor }]}>
                {(profile?.tier || 'wanderkind').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statField}>
              <Text style={styles.statValue}>{profile?.nights_walked ?? 0}</Text>
              <Text style={styles.statLabel}>NIGHTS</Text>
            </View>
            <View style={styles.statField}>
              <Text style={styles.statValue}>{profile?.stamps_collected ?? 0}</Text>
              <Text style={styles.statLabel}>STAMPS</Text>
            </View>
            <View style={styles.statField}>
              <Text style={styles.statValue}>{profile?.nights_hosted ?? 0}</Text>
              <Text style={styles.statLabel}>HOSTED</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color={colors.amber} />
            <Text style={styles.footerText}>Verified Credential</Text>
          </View>
        </WKCard>

        {/* Description */}
        <WKCard>
          <Text style={styles.title}>Official Credential</Text>
          <Text style={styles.description}>
            This pass certifies you as a member of the Wanderkind community. It represents your commitment to pilgrimage, hospitality, and the spirit of the open road.
          </Text>
        </WKCard>

        {/* Benefits */}
        <WKCard>
          <Text style={styles.title}>Pass Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.benefitText}>Access to verified hosts</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.benefitText}>Special community events</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.benefitText}>Tier advancement tracking</Text>
            </View>
          </View>
        </WKCard>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  passCard: {
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
  },
  passHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  embassy: {
    ...typography.h2,
    color: colors.amber,
    letterSpacing: 2,
    fontWeight: '900',
  },
  embassySubtitle: {
    ...typography.monoXs,
    color: colors.ink3,
    marginTop: spacing.sm,
  },
  qrArea: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoField: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.monoXs,
    color: colors.ink3,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statField: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.amber,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.caption,
    color: colors.amber,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  benefitsList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitText: {
    ...typography.body,
    color: colors.ink2,
    flex: 1,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
