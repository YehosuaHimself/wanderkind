import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../../src/hooks/useAuthGuard';

export default function RequestDetail() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams();
  if (isLoading) return null;

  const requestId = params.id as string;

  const handleAccept = () => {
    router.back();
  };

  const handleDecline = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Request Details" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Walker Profile */}
          <WKCard variant="gold">
            <View style={styles.profileHeader}>
              <View style={styles.avatarBox}>
                <Ionicons name="person-circle" size={64} color={colors.amber} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>Sophie Laurent</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Ionicons name="star" size={14} color={colors.gold} />
                    <Text style={styles.statText}>4.8</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="medal" size={14} color={colors.gold} />
                    <Text style={styles.statText}>12 stays</Text>
                  </View>
                </View>
              </View>
            </View>
          </WKCard>

          {/* Request Dates */}
          <WKCard>
            <Text style={styles.sectionTitle}>Requested Dates</Text>
            <View style={styles.dateItem}>
              <Ionicons name="calendar" size={20} color={colors.amber} />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Check-In</Text>
                <Text style={styles.dateValue}>May 20, 2024</Text>
              </View>
            </View>
            <View style={[styles.dateItem, styles.dateDivider]}>
              <Ionicons name="log-out" size={20} color={colors.amber} />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Check-Out</Text>
                <Text style={styles.dateValue}>May 23, 2024</Text>
              </View>
            </View>
            <View style={[styles.dateItem, styles.dateDivider]}>
              <Ionicons name="people" size={20} color={colors.amber} />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Guests</Text>
                <Text style={styles.dateValue}>2 people</Text>
              </View>
            </View>
          </WKCard>

          {/* Message */}
          <WKCard>
            <Text style={styles.sectionTitle}>Walker's Message</Text>
            <Text style={styles.messageText}>
              "We are two wanderkinder walking the Camino. Very excited to stay at your place! We'd love to hear about your experience hosting and learn more about the local area."
            </Text>
          </WKCard>

          {/* Walker Info */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>About Sophie</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>Verified Walker</Text>
            </View>
            <View style={[styles.infoRow, styles.infoDivider]}>
              <Text style={styles.infoLabel}>Tier</Text>
              <Text style={styles.infoValue}>Wandersmann</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reviews</Text>
              <Text style={styles.infoValue}>All 5-star ratings</Text>
            </View>
          </WKCard>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <WKButton
          title="Decline"
          onPress={handleDecline}
          variant="outline"
          fullWidth
          style={{ marginBottom: spacing.md }}
        />
        <WKButton
          title="Accept Request"
          onPress={handleAccept}
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dateDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.xs,
  },
  dateValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  messageText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  infoValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
});
