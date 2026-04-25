import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const STATS = [
  {
    label: 'Total Guests',
    value: '47',
    icon: 'people' as const,
    color: colors.blue,
  },
  {
    label: 'Average Rating',
    value: '4.8',
    icon: 'star' as const,
    color: colors.gold,
  },
  {
    label: 'Total Nights',
    value: '156',
    icon: 'moon' as const,
    color: colors.amber,
  },
  {
    label: 'Busiest Month',
    value: 'May',
    icon: 'calendar' as const,
    color: colors.green,
  },
];

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <WKCard style={styles.statCardContainer}>
      <View style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </View>
    </WKCard>
  );
}

export default function StatsScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hosting Statistics" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Overview Card */}
          <WKCard variant="gold">
            <View style={styles.overviewHeader}>
              <Ionicons name="trending-up" size={24} color={colors.amber} />
              <Text style={styles.overviewTitle}>This Year</Text>
            </View>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Hosting Since</Text>
                <Text style={styles.overviewValue}>Jan 2023</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Acceptance Rate</Text>
                <Text style={styles.overviewValue}>92%</Text>
              </View>
            </View>
          </WKCard>

          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            {STATS.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </View>

          {/* Monthly Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guests by Month</Text>
            <WKCard>
              <View style={styles.monthlyChart}>
                {[
                  { month: 'Jan', guests: 3 },
                  { month: 'Feb', guests: 2 },
                  { month: 'Mar', guests: 5 },
                  { month: 'Apr', guests: 8 },
                  { month: 'May', guests: 12 },
                  { month: 'Jun', guests: 7 },
                ].map((item, idx) => (
                  <View key={idx} style={styles.monthItem}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${(item.guests / 12) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.monthLabel}>{item.month}</Text>
                  </View>
                ))}
              </View>
            </WKCard>
          </View>

          {/* Performance Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <WKCard>
              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Ionicons name="flash" size={20} color={colors.amber} />
                  <Text style={styles.metricLabel}>Response Time</Text>
                </View>
                <Text style={styles.metricValue}>2 hours</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Ionicons name="thumbs-up" size={20} color={colors.green} />
                  <Text style={styles.metricLabel}>Guest Approval</Text>
                </View>
                <Text style={styles.metricValue}>98%</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Ionicons name="repeat" size={20} color={colors.blue} />
                  <Text style={styles.metricLabel}>Return Rate</Text>
                </View>
                <Text style={styles.metricValue}>34%</Text>
              </View>
            </WKCard>
          </View>

          {/* Insights */}
          <WKCard variant="parchment">
            <View style={styles.insightHeader}>
              <Ionicons name="bulb" size={20} color={colors.ink2} />
              <Text style={styles.insightTitle}>Insight</Text>
            </View>
            <Text style={styles.insightText}>
              You're a top performer! Your response rate and guest ratings are significantly above average.
            </Text>
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  overviewTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewStat: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  overviewLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  overviewValue: {
    ...typography.h2,
    color: colors.ink,
  },
  overviewDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statCardContainer: {
    padding: spacing.lg,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  statValue: {
    ...typography.h2,
    color: colors.ink,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  monthlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingVertical: spacing.md,
  },
  monthItem: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  barContainer: {
    width: 30,
    height: 100,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.amber,
  },
  monthLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  metricLabel: {
    ...typography.body,
    color: colors.ink,
  },
  metricValue: {
    ...typography.h3,
    color: colors.ink,
  },
  metricDivider: {
    height: 1,
    backgroundColor: colors.borderLt,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  insightText: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 22,
  },
});
