/**
 * WK-143 — booking history for the walker side. Mirrors hosting/requests.tsx
 * but lists bookings I have requested, with status chips and a tap-through
 * to the existing confirm screen at /map/booking/confirm/[id].
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import type { BookingRow } from '../../../src/types/database';

interface BookingWithHost extends BookingRow {
  host_name: string;
  host_category: string | null;
  host_country: string | null;
}

const STATUS_TINT: Record<string, string> = {
  pending: '#D4A017',
  seen: '#2E6DA4',
  accepted: '#27864A',
  confirmed: '#27864A',
  declined: '#B03A3A',
  cancelled: '#9B8E7E',
  completed: '#5A7A2B',
};
const STATUS_BG: Record<string, string> = {
  pending: 'rgba(212,160,23,0.10)',
  seen: 'rgba(46,109,164,0.10)',
  accepted: 'rgba(39,134,74,0.10)',
  confirmed: 'rgba(39,134,74,0.10)',
  declined: 'rgba(176,58,58,0.10)',
  cancelled: 'rgba(155,142,126,0.10)',
  completed: 'rgba(90,122,43,0.10)',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateRange(start: string, end: string | null): string {
  if (!end) return formatDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sShort = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
  const eShort = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${sShort} → ${eShort}`;
}

export default function MyBookings() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { data: rows } = await supabase
        .from('bookings')
        .select('*')
        .eq('walker_id', user.id)
        .order('created_at', { ascending: false });

      if (!rows?.length) { setBookings([]); return; }

      const hostIds = [...new Set(rows.map((b: BookingRow) => b.host_id))];
      const { data: hosts } = await supabase
        .from('hosts')
        .select('id, name, category, country')
        .in('id', hostIds);

      const hostMap = new Map((hosts || []).map((h: any) => [h.id, h]));
      const enriched: BookingWithHost[] = rows.map((b: BookingRow) => {
        const h = hostMap.get(b.host_id) as any;
        return {
          ...b,
          host_name: h?.name ?? 'Wanderhost',
          host_category: h?.category ?? null,
          host_country: h?.country ?? null,
        };
      });

      setBookings(enriched);
    } catch (e) {
      // best-effort — leave list empty on failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="My Bookings" showBack />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="My Bookings" showBack />
      {bookings.length === 0 ? (
        <View style={{ flex: 1 }}>
          <WKEmpty
            icon="bed-outline"
            title="No bookings yet"
            message="When you reserve a roof from the map, your requests live here."
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: 32 }}
          data={bookings}
          keyExtractor={(b) => b.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const s = item.status || 'pending';
            const tint = STATUS_TINT[s] ?? colors.ink2;
            const bg = STATUS_BG[s] ?? 'rgba(155,142,126,0.06)';
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(tabs)/map/booking/confirm', params: { bookingId: item.id } } as any)}
                style={styles.card}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.hostName} numberOfLines={1}>{item.host_name}</Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {dateRange(item.check_in, item.check_out)}{item.host_country ? ` · ${item.host_country}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: bg, borderColor: tint }]}>
                    <Text style={[styles.statusText, { color: tint }]}>{s.toUpperCase()}</Text>
                  </View>
                </View>
                {item.message ? (
                  <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={12} color={colors.ink3} />
                  <Text style={styles.meta}>{item.guests ?? 1} {item.guests === 1 ? 'guest' : 'guests'}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="time-outline" size={12} color={colors.ink3} />
                  <Text style={styles.meta}>requested {formatDate(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostName: { ...typography.body, fontWeight: '700', color: colors.ink },
  sub: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  statusChip: {
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  message: {
    ...typography.bodySm,
    color: colors.ink2,
    marginTop: 8,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  meta: {
    ...typography.caption,
    color: colors.ink3,
  },
  dot: { color: colors.ink3, marginHorizontal: 2 },
});
