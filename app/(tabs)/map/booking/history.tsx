import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';

interface Booking {
  id: string;
  hostName: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  stampsEarned: number;
  rating?: number;
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    hostName: 'Maria Gonzalez',
    location: 'Burgos, Spain',
    checkInDate: '2024-05-15',
    checkOutDate: '2024-05-18',
    stampsEarned: 3,
    rating: 5,
  },
  {
    id: '2',
    hostName: 'Jean-Pierre Martin',
    location: 'Bayonne, France',
    checkInDate: '2024-04-20',
    checkOutDate: '2024-04-22',
    stampsEarned: 2,
    rating: 5,
  },
  {
    id: '3',
    hostName: 'Anna Mueller',
    location: 'Zurich, Switzerland',
    checkInDate: '2024-04-10',
    checkOutDate: '2024-04-11',
    stampsEarned: 1,
    rating: 4,
  },
];

export default function BookingHistory() {
  const router = useRouter();

  const renderBooking = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => router.push(`/booking/review?bookingId=${item.id}`)}
    >
      <WKCard>
        <View style={styles.bookingHeader}>
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{item.hostName}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar" size={16} color={colors.ink2} />
          <Text style={styles.dateText}>
            {new Date(item.checkInDate).toLocaleDateString()} -
            {new Date(item.checkOutDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="medal" size={16} color={colors.gold} />
            <Text style={styles.statText}>
              {item.stampsEarned} stamps earned
            </Text>
          </View>
          {item.rating && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.gold} />
              <Text style={styles.statText}>{item.rating}.0 rated</Text>
            </View>
          )}
        </View>
      </WKCard>
    </TouchableOpacity>
  );

  if (MOCK_BOOKINGS.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Stay History" />
        <WKEmpty
          icon="bed-outline"
          title="No Past Stays"
          message="Your booking history will appear here"
          iconColor={colors.amberLine}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Stay History" />

      <View style={styles.statsCard}>
        <WKCard variant="gold">
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{MOCK_BOOKINGS.length}</Text>
              <Text style={styles.statLabel}>Total Stays</Text>
            </View>
            <View style={[styles.statBox, styles.statDivider]}>
              <Text style={styles.statNumber}>
                {MOCK_BOOKINGS.reduce((sum, b) => sum + b.stampsEarned, 0)}
              </Text>
              <Text style={styles.statLabel}>Stamps Earned</Text>
            </View>
          </View>
        </WKCard>
      </View>

      <FlatList
        data={MOCK_BOOKINGS}
        renderItem={renderBooking}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  statsCard: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statNumber: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  listContent: {
    paddingHorizontal: spacing.screenPx,
    paddingBottom: spacing.lg,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  dateText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
});
