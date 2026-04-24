import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';

type BookingStatus = 'pending' | 'confirmed' | 'declined';

export default function BookingConfirm() {
  const router = useRouter();
  const [status, setStatus] = useState<BookingStatus>('pending');

  const statusConfig = {
    pending: {
      icon: 'time-outline' as const,
      title: 'Request Pending',
      color: colors.ink2,
      message: 'Waiting for the host to respond to your request.',
    },
    confirmed: {
      icon: 'checkmark-circle' as const,
      title: 'Stay Confirmed',
      color: colors.green,
      message: 'Your booking is confirmed. Check-in details below.',
    },
    declined: {
      icon: 'close-circle' as const,
      title: 'Request Declined',
      color: colors.red,
      message: 'The host is not available for your dates.',
    },
  };

  const config = statusConfig[status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Booking Status" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Ionicons name={config.icon} size={64} color={config.color} />
            <Text style={[styles.statusTitle, { color: config.color }]}>
              {config.title}
            </Text>
            <Text style={styles.statusMessage}>{config.message}</Text>
          </View>

          {/* Booking Details */}
          <WKCard>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Host</Text>
              <Text style={styles.detailValue}>Maria Gonzalez</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>Burgos, Spain</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Check-In</Text>
              <Text style={styles.detailValue}>May 15, 2024</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Check-Out</Text>
              <Text style={styles.detailValue}>May 18, 2024</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>1</Text>
            </View>
          </WKCard>

          {/* Host Info - if confirmed */}
          {status === 'confirmed' && (
            <WKCard variant="gold">
              <Text style={styles.sectionTitle}>Host Information</Text>
              <View style={styles.hostSection}>
                <View style={styles.hostAvatar}>
                  <Ionicons name="person-circle" size={48} color={colors.amber} />
                </View>
                <View style={styles.hostDetails}>
                  <Text style={styles.hostName}>Maria Gonzalez</Text>
                  <Text style={styles.hostBio}>
                    Verified host with 4.9 rating
                  </Text>
                </View>
              </View>
            </WKCard>
          )}

          {/* Action Buttons */}
          {status === 'pending' && (
            <View style={styles.buttonGroup}>
              <WKButton
                title="Cancel Request"
                onPress={() => router.back()}
                variant="outline"
                fullWidth
              />
            </View>
          )}

          {status === 'confirmed' && (
            <View style={styles.buttonGroup}>
              <WKButton
                title="View Check-In Info"
                onPress={() => router.push('/booking/active')}
                fullWidth
              />
            </View>
          )}

          {status === 'declined' && (
            <View style={styles.buttonGroup}>
              <WKButton
                title="Find Another Host"
                onPress={() => router.back()}
                fullWidth
              />
            </View>
          )}
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
  statusBadge: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  statusTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  statusMessage: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  detailLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  detailValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: 2,
  },
  hostBio: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  buttonGroup: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
