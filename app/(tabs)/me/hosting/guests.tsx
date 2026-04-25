import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface Guest {
  id: string;
  name: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'checked-in' | 'checked-out';
}

const MOCK_GUESTS: Guest[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    checkInDate: '2024-05-12',
    checkOutDate: '2024-05-16',
    status: 'checked-in',
  },
  {
    id: '2',
    name: 'Anna Mueller',
    checkInDate: '2024-04-28',
    checkOutDate: '2024-04-30',
    status: 'checked-out',
  },
];

export default function HostingGuests() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const renderGuest = ({ item }: { item: Guest }) => (
    <TouchableOpacity activeOpacity={0.6}>
      <WKCard>
        <View style={styles.guestHeader}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-circle" size={44} color={colors.amber} />
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.guestName}>{item.name}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'checked-in'
                    ? styles.statusCheckIn
                    : styles.statusCheckOut,
                ]}
              >
                <Ionicons
                  name={
                    item.status === 'checked-in'
                      ? 'checkmark-circle'
                      : 'exit-outline'
                  }
                  size={14}
                  color={
                    item.status === 'checked-in' ? colors.green : colors.ink2
                  }
                />
                <Text style={styles.statusText}>
                  {item.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.dates}>
          <Ionicons name="calendar" size={16} color={colors.ink2} />
          <Text style={styles.dateText}>
            {new Date(item.checkInDate).toLocaleDateString()} -
            {new Date(item.checkOutDate).toLocaleDateString()}
          </Text>
        </View>
      </WKCard>
    </TouchableOpacity>
  );

  if (MOCK_GUESTS.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Current Guests" />
        <WKEmpty
          icon="people-outline"
          title="No Guests"
          message="Your current guests will appear here"
          iconColor={colors.amberLine}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Current Guests" />

      <FlatList
        data={MOCK_GUESTS}
        renderItem={renderGuest}
        keyExtractor={item => item.id}
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
  listContent: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
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
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  statusCheckIn: {
    backgroundColor: 'rgba(39,134,74,0.08)',
  },
  statusCheckOut: {
    backgroundColor: colors.surfaceAlt,
  },
  statusText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  dateText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
});
