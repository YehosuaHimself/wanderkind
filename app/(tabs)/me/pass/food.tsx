import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

export default function FoodPassScreen() {
  const { profile } = useAuth();
  const mealsShared = profile?.meals_shared ?? 0;
  const donativoContributions = profile?.donativo_contributions ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Food Pass" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Main Stats */}
        <WKCard variant="gold" style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.mainValue}>{mealsShared}</Text>
            <Text style={styles.mainLabel}>MEALS SHARED</Text>
          </View>
        </WKCard>

        {/* Secondary Stats */}
        <WKCard style={styles.secondaryCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons name="heart" size={24} color={colors.passFood} />
              <Text style={styles.statValue}>{donativoContributions}</Text>
              <Text style={styles.statLabel}>DONATIVO</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Ionicons name="star" size={24} color={colors.gold} />
              <Text style={styles.statValue}>{Math.floor(mealsShared / 10)}</Text>
              <Text style={styles.statLabel}>MILESTONES</Text>
            </View>
          </View>
        </WKCard>

        {/* Progress */}
        <WKCard>
          <Text style={styles.title}>Progress to Next Milestone</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((mealsShared % 10) / 10) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {mealsShared % 10}/10 meals
            </Text>
          </View>
        </WKCard>

        {/* Description */}
        <WKCard>
          <Text style={styles.title}>What This Means</Text>
          <Text style={styles.description}>
            The Food Pass tracks meals you've shared with other wanderers. Whether through a hosted dinner, shared supplies, or culinary generosity on the road, every meal builds community.
          </Text>
        </WKCard>

        {/* How to Contribute */}
        <WKCard>
          <Text style={styles.title}>How to Contribute</Text>
          <View style={styles.contributeList}>
            <View style={styles.item}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>1</Text>
              </View>
              <Text style={styles.itemText}>Share meals with guests</Text>
            </View>
            <View style={styles.item}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>2</Text>
              </View>
              <Text style={styles.itemText}>Mark donations to the cause</Text>
            </View>
            <View style={styles.item}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>3</Text>
              </View>
              <Text style={styles.itemText}>Earn community recognition</Text>
            </View>
          </View>
        </WKCard>
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
  statsCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  mainStat: {
    alignItems: 'center',
  },
  mainValue: {
    ...typography.display,
    color: colors.passFood,
  },
  mainLabel: {
    ...typography.bodySm,
    color: colors.gold,
    marginTop: spacing.md,
    letterSpacing: 1,
    fontWeight: '600',
  },
  secondaryCard: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.passFood,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: colors.borderLt,
  },
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  progressContainer: {
    gap: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.passFood,
  },
  progressText: {
    ...typography.caption,
    color: colors.ink3,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  contributeList: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.passFood,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    ...typography.bodySm,
    color: '#fff',
    fontWeight: '600',
  },
  itemText: {
    ...typography.body,
    color: colors.ink2,
  },
});
