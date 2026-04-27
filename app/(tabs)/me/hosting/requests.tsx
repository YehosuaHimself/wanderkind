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
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import type { BookingRow } from '../../../src/types/database';

interface RequestWithWalker extends BookingRow {
  walker_trail_name: string;
  walker_avatar: string | null;
  walker_rating: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: colors.amber,
  seen: colors.blue,
  accepted: '#22c55e',
  declined: colors.red,
  cancelled: colors.ink3,
  completed: colors.ink2,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HostingRequests() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestWithWalker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    try {
      // Get all bookings where this user is the host, ordered newest first
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (!bookings?.length) { setRequests([]); return; }

      // Fetch walker profiles in one query
      const walkerIds = [...new Set(bookings.map((b: BookingRow) => b.walker_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, trail_name, avatar_url, rating')
        .in('id', walkerIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const enriched: RequestWithWalker[] = bookings.map((b: BookingRow) => {
        const p = profileMap.get(b.walker_id);
        return {
          ...b,
          walker_trail_name: p?.trail_name ?? 'Wanderkind',
          walker_avatar: p?.avatar_url ?? null,
          walker_rating: p?.rating ?? null,
        };
      });

      setRequests(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const renderRequest = useCallback(({ item }: { item: RequestWithWalker }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => router.push(`/(tabs)/me/hosting/request-detail/${item.id}`)}
    >
      <WKCard>
        <View style={styles.header}>
          <View style={styles.walkerInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={40} color={colors.amber} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.walker_trail_name}</Text>
              {item.walker_rating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.rating}>{item.walker_rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={colors.ink2} />
            <Text style={styles.detailText}>
              {formatDate(item.check_in)}{item.check_out ? ` – ${formatDate(item.check_out)}` : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={colors.ink2} />
            <Text style={styles.detailText}>{item.guests} guest{item.guests !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          </View>
        ) : null}
      </WKCard>
    </TouchableOpacity>
  ), [router]);

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Incoming Requests" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!requests.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Incoming Requests" />
        <WKEmpty
          icon="mail-outline"
          title="No Requests Yet"
          message="Booking requests from wanderkinder will appear here"
          iconColor={colors.amberLine}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Incoming Requests" />
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.screenPx, paddingVertical: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  walkerInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { ...typography.h3, color: colors.ink, marginBottom: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...typography.bodySm, color: colors.ink2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm },
  statusText: { fontFamily: 'Courier New', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  details: { gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { ...typography.bodySm, color: colors.ink2 },
  messageBox: { paddingVertical: spacing.md, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.md, borderRadius: radii.md },
  message: { ...typography.body, color: colors.ink, lineHeight: 20 },
});
