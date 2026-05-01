import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKInput } from '../../../../src/components/ui/WKInput';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface CheckInGuest {
  id: string;
  name: string;
  checked: boolean;
  date: string;
}

function GuestCheckInItem({
  guest,
  onCheck,
}: {
  guest: CheckInGuest;
  onCheck: (id: string) => void;
}) {
  return (
    <WKCard style={styles.guestCard}>
      <View style={styles.guestContent}>
        <View style={styles.guestLeft}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-circle" size={40} color={colors.amber} />
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.guestName}>{guest.name}</Text>
            <Text style={styles.guestDate}>{guest.date}</Text>
          </View>
        </View>
        {guest.checked ? (
          <View style={styles.checkIcon}>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={colors.green}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => onCheck(guest.id)}
          >
            <Ionicons
              name="checkmark-outline"
              size={24}
              color={colors.amber}
            />
          </TouchableOpacity>
        )}
      </View>
    </WKCard>
  );
}

export default function CheckInScreen() {
  const { user, isLoading } = useAuthGuard();
  const [guests, setGuests] = useState<CheckInGuest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);


  // Fetch upcoming bookings for check-in management
  React.useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('bookings')
      .select('id, start_date, walker_id')
      .eq('host_id', user.id)
      .in('status', ['accepted'])
      .gte('start_date', today)
      .order('start_date')
      .limit(20)
      .then(({ data }: { data: any }) => {
        if (!data) return;
        const items: CheckInGuest[] = data.map((b: any) => ({
          id: b.id,
          name: b.walker_name ?? 'Wanderkind',
          checked: false,
          date: new Date(b.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        }));
        setGuests(items);
      });
  }, [user]);

  const handleCheckIn = (id: string) => {
    setGuests((prevGuests) =>
      prevGuests.map((g) => (g.id === id ? { ...g, checked: true } : g))
    );
  };

  const checkedCount = guests.filter((g) => g.checked).length;

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Guest Check-In" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Stats */}
          <WKCard variant="gold">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Checked In</Text>
                <Text style={styles.statValue}>{checkedCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Expected</Text>
                <Text style={styles.statValue}>{guests.length}</Text>
              </View>
            </View>
          </WKCard>

          {/* QR Scanner */}
          <WKCard style={styles.qrCard}>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQRScanner(!showQRScanner)}
            >
              <Ionicons name="qr-code" size={48} color={colors.amber} />
              <Text style={styles.qrText}>Scan QR Code</Text>
              <Text style={styles.qrHint}>Scan guest pass or wanderkind ID</Text>
            </TouchableOpacity>
          </WKCard>

          {/* Manual Search */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Or Find Guest by Name</Text>
            <WKInput
              label="Guest Name"
              value={searchName}
              onChangeText={setSearchName}
              placeholder="Enter guest name..."
            />
          </View>

          {/* Active Guests List */}
          <View style={styles.section}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Expected Guests</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{guests.length}</Text>
              </View>
            </View>
            <FlatList
              data={guests}
              renderItem={({ item }: { item: any }) => (
                <GuestCheckInItem
                  guest={item}
                  onCheck={handleCheckIn}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />
          </View>

          {/* Info Card */}
          <WKCard variant="parchment">
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.ink2} />
              <Text style={styles.infoTitle}>Quick Tip</Text>
            </View>
            <Text style={styles.infoText}>
              Use QR scanning to check in guests quickly. This stamps their Wanderkind pass and creates a record of their stay.
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  statValue: {
    ...typography.h2,
    color: colors.ink,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  qrCard: {
    padding: 0,
  },
  qrButton: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  qrText: {
    ...typography.h3,
    color: colors.amber,
  },
  qrHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  badge: {
    backgroundColor: colors.amber,
    borderRadius: radii.full,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...typography.bodySm,
    color: colors.surface,
    fontWeight: '700',
  },
  listContent: {
    gap: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  guestCard: {
    gap: spacing.md,
  },
  guestContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
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
    gap: spacing.xs,
  },
  guestName: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  guestDate: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  checkIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
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
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
});
