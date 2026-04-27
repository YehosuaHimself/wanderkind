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
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function BookingActive() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  if (isLoading) return null;


  const handleContactHost = () => {
    router.push('/(tabs)/messages');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Current Stay" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Stay Status */}
          <WKCard variant="gold">
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusLabel}>Check-in in</Text>
                <Text style={styles.daysCount}>2 days</Text>
              </View>
              <Ionicons name="calendar" size={48} color={colors.gold} />
            </View>
          </WKCard>

          {/* Host Details */}
          <WKCard>
            <Text style={styles.sectionTitle}>Your Host</Text>
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Ionicons name="person-circle" size={56} color={colors.amber} />
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>Maria Gonzalez</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleContactHost}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.amber} />
              <Text style={styles.infoText}>Message Maria</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
            </TouchableOpacity>
          </WKCard>

          {/* Address & Check-In Info */}
          <WKCard>
            <Text style={styles.sectionTitle}>Check-In Details</Text>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color={colors.amber} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  Calle Mayor 123, Burgos, Spain 09001
                </Text>
              </View>
            </View>
            <View style={[styles.infoItem, styles.infoDivider]}>
              <Ionicons name="time" size={20} color={colors.amber} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-In Time</Text>
                <Text style={styles.infoValue}>4:00 PM - 8:00 PM</Text>
              </View>
            </View>
            <View style={[styles.infoItem, styles.infoDivider]}>
              <Ionicons name="exit" size={20} color={colors.amber} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-Out</Text>
                <Text style={styles.infoValue}>May 18, 2024 · 10:00 AM</Text>
              </View>
            </View>
          </WKCard>

          {/* Door Access */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Door Access</Text>
            <View style={styles.doorBox}>
              <Ionicons name="key" size={32} color={colors.amber} />
              <Text style={styles.doorLabel}>Door PIN</Text>
              <Text style={styles.doorPin}>4829</Text>
              <TouchableOpacity style={styles.copyBtn}>
                <Ionicons name="copy" size={16} color={colors.amber} />
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </WKCard>

          {/* House Rules */}
          <WKCard>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <View style={styles.rulesList}>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <Text style={styles.ruleText}>Shoes off in the house</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <Text style={styles.ruleText}>Quiet hours: 10 PM - 8 AM</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <Text style={styles.ruleText}>No pets allowed</Text>
              </View>
            </View>
          </WKCard>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <WKButton
          title="Check In"
          onPress={() => router.push('/(tabs)/map/booking/history')}
          fullWidth
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screenPx,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.xs,
  },
  daysCount: {
    ...typography.h1,
    color: colors.ink,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    ...typography.bodySm,
    color: colors.ink2,
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.amber,
    flex: 1,
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
  doorBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  doorLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  doorPin: {
    ...typography.display,
    color: colors.ink,
    letterSpacing: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  copyText: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
  },
  rulesList: {
    gap: spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ruleText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
});
