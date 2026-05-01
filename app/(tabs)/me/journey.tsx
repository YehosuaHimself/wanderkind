import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const TIERS = [
  { name: 'Wanderkind', threshold: 0 },
  { name: 'Wunderkind', threshold: 5 },
  { name: 'Wandersmann', threshold: 10 },
  { name: 'Ehrenmann', threshold: 20 },
  { name: 'Pilger', threshold: 30 },
  { name: 'Apostel', threshold: 40 },
  { name: 'Lehrer', threshold: 50 },
  { name: 'Meister', threshold: 75 },
  { name: 'Grossmeister', threshold: 100 },
  { name: 'Legende', threshold: 150 },
  { name: 'König', threshold: 200 },
];

export default function JourneyScreen() {
  useAuthGuard();

  const { profile } = useAuth();
  const currentNights = profile?.nights_walked ?? 0;
  const currentTierIdx = TIERS.findIndex(t => profile?.tier === t.name.toLowerCase()) ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Your Journey" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Your journey is measured in nights — nights you walked, slept in a stranger's home, or trusted the road. Each tier is earned through presence, not payment.
        </Text>

        {TIERS.map((tier, idx) => {
          const isActive = idx <= currentTierIdx;
          const isCurrent = idx === currentTierIdx;
          const nextThreshold = TIERS[idx + 1]?.threshold;
          const progress = isCurrent && nextThreshold
            ? Math.min((currentNights - tier.threshold) / (nextThreshold - tier.threshold), 1)
            : 0;

          return (
            <WKCard
              key={tier.name}
              variant={isCurrent ? 'parchment' : 'default'}
              style={[styles.tierCard, !isActive && styles.tierCardInactive] as any}
            >
              <View style={styles.tierContent}>
                <View style={styles.tierIcon}>
                  <View
                    style={[
                      styles.tierDot,
                      { backgroundColor: tierColors[tier.name.toLowerCase()] },
                    ]}
                  />
                </View>

                <View style={styles.tierInfo}>
                  <Text
                    style={[
                      styles.tierName,
                      isCurrent && styles.tierNameActive,
                    ]}
                  >
                    {tier.name.toUpperCase()}
                  </Text>
                  <Text style={styles.tierThreshold}>
                    {tier.threshold} nights
                  </Text>
                </View>

                {isCurrent && (
                  <View style={styles.tierBadge}>
                    <Ionicons name="star" size={16} color={colors.amber} />
                    <Text style={styles.tierBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>

              {isCurrent && nextThreshold && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {currentNights}/{nextThreshold} nights
                  </Text>
                </View>
              )}
            </WKCard>
          );
        })}

      </ScrollView>
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
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  tierCard: {
    marginBottom: spacing.md,
  },
  tierCardInactive: {
    opacity: 0.5,
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tierNameActive: {
    color: colors.amber,
  },
  tierThreshold: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  tierBadge: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tierBadgeText: {
    ...typography.monoXs,
    color: colors.amber,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  progressText: {
    ...typography.caption,
    color: colors.ink3,
  },
  _infoCard_unused: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  _infoText_unused: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
});
