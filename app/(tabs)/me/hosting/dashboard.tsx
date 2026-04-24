import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';

export default function HostingDashboard() {
  const router = useRouter();

  const stats = [
    { label: 'Total Hosted', value: '12', icon: 'home' as const },
    { label: 'Rating', value: '4.9', icon: 'star' as const },
    { label: 'Requests', value: '3', icon: 'mail' as const },
  ];

  const quickActions = [
    { label: 'Requests', icon: 'mail-unread' as const, route: '/hosting/requests' },
    { label: 'Edit Listing', icon: 'pencil' as const, route: '/hosting/listing-edit' },
    { label: 'Calendar', icon: 'calendar' as const, route: '/hosting/calendar' },
    { label: 'Statistics', icon: 'bar-chart' as const, route: '/hosting/stats' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hosting Dashboard" showBack={false} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <WKCard key={idx} style={styles.statCard}>
                <View style={styles.statContent}>
                  <Ionicons name={stat.icon} size={28} color={colors.amber} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </WKCard>
            ))}
          </View>

          {/* Current Guests */}
          <WKCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Guests</Text>
              <TouchableOpacity onPress={() => router.push('/hosting/guests')}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.guestItem}>
              <View style={styles.guestAvatar}>
                <Ionicons name="person-circle" size={40} color={colors.amber} />
              </View>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>Jean Dupont</Text>
                <Text style={styles.guestDates}>May 12 - 16</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
            </View>
          </WKCard>

          {/* Pending Requests */}
          <WKCard variant="gold">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              <Text style={styles.badge}>3</Text>
            </View>
            <Text style={styles.hint}>You have 3 new booking requests</Text>
            <WKButton
              title="Review Requests"
              onPress={() => router.push('/hosting/requests')}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </WKCard>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.actionIconBox}>
                  <Ionicons name={action.icon} size={28} color={colors.amber} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Card */}
          <WKCard variant="parchment">
            <View style={styles.infoHeader}>
              <Ionicons name="bulb" size={20} color={colors.amber} />
              <Text style={styles.infoTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.infoText}>
              Respond to requests within 24 hours to increase your acceptance rate and earn more stamps.
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  statContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.ink,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  seeAllLink: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.red,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  hint: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.md,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  guestDates: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    ...typography.bodySm,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  infoText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
});
