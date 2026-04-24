import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

export default function WaterPassScreen() {
  const { profile } = useAuth();
  const waterSourcesShared = profile?.water_sources_shared ?? 0;
  const fountainsMarked = profile?.fountains_marked ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Water Pass" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Main Stat */}
        <WKCard variant="gold" style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.mainValue}>{waterSourcesShared}</Text>
            <Text style={styles.mainLabel}>WATER SOURCES</Text>
          </View>
        </WKCard>

        {/* Secondary Stats */}
        <WKCard style={styles.secondaryCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons name="water" size={24} color={colors.passWater} />
              <Text style={styles.statValue}>{fountainsMarked}</Text>
              <Text style={styles.statLabel}>FOUNTAINS</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Ionicons name="leaf" size={24} color={colors.green} />
              <Text style={styles.statValue}>{Math.floor((waterSourcesShared + fountainsMarked) / 10)}</Text>
              <Text style={styles.statLabel}>IMPACT</Text>
            </View>
          </View>
        </WKCard>

        {/* Description */}
        <WKCard>
          <Text style={styles.title}>Water Sources & Sustainability</Text>
          <Text style={styles.description}>
            The Water Pass tracks your contribution to a hydrated, sustainable pilgrimage. Every fountain marked and water source shared helps fellow wanderers walk safely and respectfully.
          </Text>
        </WKCard>

        {/* How to Contribute */}
        <WKCard>
          <Text style={styles.title}>Share Water Sources</Text>
          <View style={styles.actionList}>
            <View style={styles.actionItem}>
              <View style={styles.actionNumber}>
                <Text style={styles.actionNumberText}>1</Text>
              </View>
              <Text style={styles.actionText}>Mark fountains and water stations on the map</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionNumber}>
                <Text style={styles.actionNumberText}>2</Text>
              </View>
              <Text style={styles.actionText}>Report water quality and availability</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionNumber}>
                <Text style={styles.actionNumberText}>3</Text>
              </View>
              <Text style={styles.actionText}>Help other wanderers stay hydrated</Text>
            </View>
          </View>
        </WKCard>

        {/* Stats */}
        <WKCard>
          <Text style={styles.title}>Your Water Stewardship</Text>
          <View style={styles.statsList}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.passWater} />
              <Text style={styles.infoLabel}>Active Contributor</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={16} color={colors.passWater} />
              <Text style={styles.infoLabel}>Community Impact</Text>
              <Text style={styles.infoValue}>Growing</Text>
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
    color: colors.passWater,
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
    color: colors.passWater,
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
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  actionList: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.passWater,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionNumberText: {
    ...typography.bodySm,
    color: '#fff',
    fontWeight: '600',
  },
  actionText: {
    ...typography.body,
    color: colors.ink2,
    flex: 1,
  },
  statsList: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    color: colors.ink2,
    flex: 1,
  },
  infoValue: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
});
