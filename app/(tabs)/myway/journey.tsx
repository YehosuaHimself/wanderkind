import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

/**
 * The 13 tiers of the Wanderkind journey (0-12).
 * Each tier requires a specific duration of walking.
 */
const TIERS: { level: number; name: string; requirement: string; daysNeeded: number; icon: keyof typeof Ionicons.glyphMap }[] = [
  { level: 0, name: 'Wanderkind', requirement: 'Always', daysNeeded: 0, icon: 'footsteps-outline' },
  { level: 1, name: 'Wunderkind', requirement: '1 night · 2 days', daysNeeded: 2, icon: 'sparkles-outline' },
  { level: 2, name: 'Wandersmann', requirement: '2 nights · 3 days', daysNeeded: 3, icon: 'walk-outline' },
  { level: 3, name: 'Ehrenmann', requirement: '3 nights · 4 days', daysNeeded: 4, icon: 'ribbon-outline' },
  { level: 4, name: 'Wundermacher', requirement: '7 nights · 8 days', daysNeeded: 8, icon: 'compass-outline' },
  { level: 5, name: 'Pilger', requirement: '11 days', daysNeeded: 11, icon: 'map-outline' },
  { level: 6, name: 'Apostel', requirement: '15 days', daysNeeded: 15, icon: 'flame-outline' },
  { level: 7, name: 'Bergapostel', requirement: '1 month, 1 day', daysNeeded: 32, icon: 'trail-sign-outline' },
  { level: 8, name: 'Lehrer', requirement: '3 months, 3 days', daysNeeded: 93, icon: 'book-outline' },
  { level: 9, name: 'Meister', requirement: '7 months, 7 days', daysNeeded: 217, icon: 'shield-checkmark-outline' },
  { level: 10, name: 'Grossmeister', requirement: '1 year, 1 day', daysNeeded: 366, icon: 'diamond-outline' },
  { level: 11, name: 'Legende', requirement: '2 years, 2 days', daysNeeded: 732, icon: 'star-outline' },
  { level: 12, name: 'König', requirement: '3 years, 3 days+', daysNeeded: 1098, icon: 'trophy-outline' },
];

interface JourneyContentProps {
  embedded?: boolean;
}

export default function JourneyContent({ embedded }: JourneyContentProps) {
  const { profile } = useAuth();
  const currentDays = (profile?.nights_walked ?? 0) + 1; // nights + 1 = days on the road

  // Find current tier
  const currentTierIdx = TIERS.reduce((acc, tier, idx) => {
    return currentDays >= tier.daysNeeded ? idx : acc;
  }, 0);

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.subtitle}>
        Climb the 13 tiers of mastery
      </Text>

      {/* Current Progress Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLevel}>{currentTierIdx}</Text>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryName}>{TIERS[currentTierIdx].name.toUpperCase()}</Text>
          <Text style={styles.summaryDays}>{profile?.nights_walked ?? 0} nights walked</Text>
        </View>
        <Ionicons name="star" size={20} color={colors.amber} />
      </View>

      {/* Tier Staircase */}
      {TIERS.map((tier, idx) => {
        const isReached = idx <= currentTierIdx;
        const isCurrent = idx === currentTierIdx;
        const nextTier = TIERS[idx + 1];
        const progress = isCurrent && nextTier
          ? Math.min(currentDays / nextTier.daysNeeded, 1)
          : 0;

        return (
          <View
            key={tier.name}
            style={[
              styles.tierCard,
              isCurrent && styles.tierCardCurrent,
              !isReached && styles.tierCardLocked,
            ]}
          >
            <View style={styles.tierRow}>
              <View style={[
                styles.tierLevel,
                isReached && { backgroundColor: tierColors[tier.name.toLowerCase()] || colors.amber },
              ]}>
                <Text style={[styles.tierLevelText, isReached && { color: '#fff' }]}>{tier.level}</Text>
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierName, isCurrent && styles.tierNameCurrent]}>
                  {tier.name}
                </Text>
                <Text style={styles.tierRequirement}>{tier.requirement}</Text>
              </View>
              {isCurrent ? (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>YOU</Text>
                </View>
              ) : (
                <Ionicons
                  name={isReached ? 'checkmark-circle' : tier.icon}
                  size={isReached ? 18 : 16}
                  color={isReached ? colors.green : colors.ink3}
                />
              )}
            </View>

            {isCurrent && nextTier && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {currentDays} / {nextTier.daysNeeded} days to {nextTier.name}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={18} color={colors.amber} />
        <Text style={styles.infoText}>
          Each tier unlocks new recognition and trust within the Wanderkind community. Keep walking!
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: spacing.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: `${colors.amber}25`,
  },
  summaryLevel: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.amber,
    width: 40,
    textAlign: 'center',
  },
  summaryInfo: { flex: 1 },
  summaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
    letterSpacing: 1,
  },
  summaryDays: {
    ...typography.caption,
    color: colors.ink2,
    marginTop: 2,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  tierCardCurrent: {
    borderColor: colors.amber,
    backgroundColor: `${colors.amber}08`,
  },
  tierCardLocked: {
    opacity: 0.45,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierLevel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink3,
  },
  tierInfo: { flex: 1 },
  tierName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  tierNameCurrent: {
    color: colors.amber,
  },
  tierRequirement: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: 1,
    fontSize: 10,
  },
  currentBadge: {
    backgroundColor: colors.amber,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  progressText: {
    ...typography.caption,
    color: colors.ink3,
    fontSize: 10,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.amber}10`,
    borderRadius: 10,
    padding: 12,
    marginTop: spacing.md,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 18,
  },
});
