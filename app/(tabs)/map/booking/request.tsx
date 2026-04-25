import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKInput } from '../../../src/components/ui/WKInput';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function BookingRequest() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const params = useLocalSearchParams();
  const hostId = params.hostId as string;

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!checkInDate || !checkOutDate || !message.trim()) {
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    router.push({
      pathname: '/booking/confirm',
      params: { bookingId: 'mock-' + Date.now() },
    });
  };

  const handleGuestChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, guests + delta));
    setGuests(newCount);
  };

  const isValid = checkInDate && checkOutDate && message.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Request Stay" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Host Info Card */}
          <WKCard variant="parchment">
            <View style={styles.hostInfo}>
              <Ionicons name="home" size={40} color={colors.amber} />
              <View style={styles.hostText}>
                <Text style={styles.hostLabel}>Requesting stay at</Text>
                <Text style={styles.hostName}>Host's Place</Text>
              </View>
            </View>
          </WKCard>

          {/* Check-In Date */}
          <WKCard>
            <Text style={styles.sectionLabel}>Check-In Date</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Ionicons name="calendar" size={20} color={colors.amber} />
              <Text style={[styles.dateText, !checkInDate && { color: colors.ink3 }]}>
                {checkInDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </WKCard>

          {/* Check-Out Date */}
          <WKCard>
            <Text style={styles.sectionLabel}>Check-Out Date</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Ionicons name="calendar" size={20} color={colors.amber} />
              <Text style={[styles.dateText, !checkOutDate && { color: colors.ink3 }]}>
                {checkOutDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </WKCard>

          {/* Number of Guests */}
          <WKCard>
            <Text style={styles.sectionLabel}>Number of Guests</Text>
            <View style={styles.guestCounter}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => handleGuestChange(-1)}
              >
                <Ionicons name="remove" size={20} color={colors.ink} />
              </TouchableOpacity>
              <Text style={styles.guestCount}>{guests}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => handleGuestChange(1)}
              >
                <Ionicons name="add" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
          </WKCard>

          {/* Message */}
          <WKCard>
            <Text style={styles.sectionLabel}>Message to Host</Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageHint}>
                Tell the host about yourself, your journey, and why you'd like to stay
              </Text>
              <WKInput
                placeholder="Write your message..."
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
                style={styles.messageInput}
              />
            </View>
          </WKCard>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={colors.ink2} />
            <Text style={styles.infoText}>
              Your profile and photos will be shared with the host when they review your request.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <WKButton
          title={loading ? 'Sending...' : 'Send Request'}
          onPress={handleSendRequest}
          disabled={!isValid || loading}
          loading={loading}
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
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostText: {
    flex: 1,
  },
  hostLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: 2,
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink2,
    marginBottom: spacing.md,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  dateText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  guestCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  counterBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  guestCount: {
    ...typography.h2,
    color: colors.ink,
    minWidth: 60,
    textAlign: 'center',
  },
  messageBox: {
    gap: spacing.md,
  },
  messageHint: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  messageInput: {
    minHeight: 120,
    paddingVertical: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.parchment,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink,
    flex: 1,
    lineHeight: 19,
  },
});
