import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import type { BookingRow } from '../../../src/types/database';

interface GuestBooking extends BookingRow {
  walker_trail_name: string;
  walker_avatar: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function GuestsScreen() {
  const { user, isLoading } = useAuthGuard();
  const [guests, setGuests] = useState<GuestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuests = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', user.id)
        .in('status', ['accepted'])
        .gte('start_date', today)
        .order('start_date', { ascending: true });

      if (!bookings?.length) { setGuests([]); return; }

      const walkerIds = [...new Set(bookings.map((b: BookingRow) => b.walker_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, trail_name, avatar_url')
        .in('id', walkerIds);

      const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      setGuests(bookings.map((b: BookingRow) => ({
        ...b,
        walker_trail_name: pm.get(b.walker_id)?.trail_name ?? 'Wanderkind',
        walker_avatar: pm.get(b.walker_id)?.avatar_url ?? null,
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const onRefresh = () => { setRefreshing(true); fetchGuests(); };

  const renderGuest = useCallback(({ item }: { item: GuestBooking }) => (
    <WKCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={40} color={colors.amber} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.walker_trail_name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.ink3} />
            <Text style={styles.dates}>{formatDate(item.start_date)}{item.end_date ? ` → ${formatDate(item.end_date)}` : ''}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="people-outline" size={13} color={colors.ink3} />
            <Text style={styles.dates}>{item.guests} guest{item.guests !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
      </View>
      {item.message ? <Text style={styles.message} numberOfLines={2}>{item.message}</Text> : null}
    </WKCard>
  ), []);

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Current Guests" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Current Guests" showBack />
      <FlatList
        data={guests}
        keyExtractor={g => g.id}
        renderItem={renderGuest}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
        ListEmptyComponent={
          <WKEmpty icon="people-outline" title="No guests yet" message="Accepted bookings will appear here" iconColor={colors.amberLine} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { ...typography.h3, color: colors.ink, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dates: { ...typography.bodySm, color: colors.ink3 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  message: { ...typography.bodySm, color: colors.ink2, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLt },
});
