/**
 * Hosting · Dashboard — WK-130
 * Real Supabase queries: my listings, pending requests, upcoming
 * arrivals, active stays, lifetime stats from stamps + gaestebuch.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';

type Listing = { id: string; name: string; category: string | null };
type Booking = {
  id: string;
  host_id: string;
  walker_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  message: string | null;
  created_at: string;
  walker?: { trail_name: string | null; avatar_url: string | null };
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function formatDateRange(s: string | null, e: string | null) {
  if (!s) return '—';
  const start = new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (!e) return start;
  const end = new Date(e).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

export default function HostingDashboard() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [pending, setPending] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [active, setActive] = useState<Booking[]>([]);
  const [stampsCount, setStampsCount] = useState(0);
  const [uniqueWalkers, setUniqueWalkers] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      // 1. My listings
      const { data: hostRows } = await supabase
        .from('hosts')
        .select('id, name, category')
        .eq('profile_id', user.id);
      const my = (hostRows as Listing[]) || [];
      setListings(my);
      const hostIds = my.map(h => h.id);

      if (hostIds.length === 0) {
        setPending([]); setUpcoming([]); setActive([]);
        setStampsCount(0); setUniqueWalkers(0); setAvgRating(null);
        return;
      }

      const today = todayISO();
      const in7  = inDaysISO(7);

      // 2. Run the three booking queries + the two stats queries in parallel
      const [pendRes, upRes, actRes, stampsRes, gbRes] = await Promise.all([
        supabase.from('bookings')
          .select('*, walker:profiles(trail_name, avatar_url)')
          .in('host_id', hostIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase.from('bookings')
          .select('*, walker:profiles(trail_name, avatar_url)')
          .in('host_id', hostIds)
          .eq('status', 'confirmed')
          .gte('start_date', today)
          .lte('start_date', in7)
          .order('start_date', { ascending: true }),
        supabase.from('bookings')
          .select('*, walker:profiles(trail_name, avatar_url)')
          .in('host_id', hostIds)
          .eq('status', 'confirmed')
          .lte('start_date', today)
          .gte('end_date', today)
          .order('start_date', { ascending: false }),
        supabase.from('stamps')
          .select('walker_id', { count: 'exact', head: false })
          .in('host_id', hostIds),
        supabase.from('gaestebuch')
          .select('rating')
          .in('host_id', hostIds),
      ]);

      setPending((pendRes.data as Booking[]) || []);
      setUpcoming((upRes.data as Booking[]) || []);
      setActive((actRes.data as Booking[]) || []);

      const stampRows = (stampsRes.data as Array<{ walker_id: string }>) || [];
      setStampsCount(stampRows.length);
      setUniqueWalkers(new Set(stampRows.map(s => s.walker_id)).size);

      const ratings = ((gbRes.data as Array<{ rating: number | null }>) || [])
        .map(r => r.rating)
        .filter((r): r is number => typeof r === 'number');
      setAvgRating(ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null);
    } catch (err) {
      console.error('dashboard fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const noListing = !loading && listings.length === 0;

  const renderBookingRow = (b: Booking, prefix: string) => (
    <TouchableOpacity
      key={b.id}
      style={styles.guestItem}
      onPress={() => router.push(`/(tabs)/me/hosting/request-detail/${b.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.guestAvatar}>
        {b.walker?.avatar_url ? (
          <Image source={{ uri: b.walker.avatar_url }} style={styles.guestAvatarImg} />
        ) : (
          <Ionicons name="person" size={20} color={colors.ink3} />
        )}
      </View>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{b.walker?.trail_name ?? 'Wanderkind'}</Text>
        <Text style={styles.guestDates}>
          {prefix ? `${prefix} · ` : ''}{formatDateRange(b.start_date, b.end_date)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Hosting Dashboard" showBack={false} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hosting Dashboard" showBack={false} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor={colors.amber}
          />
        }
      >
        <View style={styles.content}>

          {/* Empty state for non-hosts */}
          {noListing ? (
            <WKCard variant="gold" style={styles.emptyCard}>
              <Ionicons name="home" size={36} color={colors.amber} />
              <Text style={styles.emptyTitle}>You haven't claimed a listing yet</Text>
              <Text style={styles.emptyBody}>
                A Wanderhost is a Wanderkind who hosts. Free or donativo. Three taps.
              </Text>
              <WKButton
                title="Become a Wanderhost"
                onPress={() => router.push('/(tabs)/more/wanderhost-claim' as any)}
                variant="primary"
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </WKCard>
          ) : (
            <>
              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <WKCard style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Ionicons name="home" size={26} color={colors.amber} />
                    <Text style={styles.statValue}>{stampsCount}</Text>
                    <Text style={styles.statLabel}>Total hosted</Text>
                  </View>
                </WKCard>
                <WKCard style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Ionicons name="people" size={26} color={colors.amber} />
                    <Text style={styles.statValue}>{uniqueWalkers}</Text>
                    <Text style={styles.statLabel}>Walkers</Text>
                  </View>
                </WKCard>
                <WKCard style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Ionicons name="star" size={26} color={colors.amber} />
                    <Text style={styles.statValue}>{avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
                    <Text style={styles.statLabel}>Avg rating</Text>
                  </View>
                </WKCard>
              </View>

              {/* Active stays */}
              {active.length > 0 ? (
                <WKCard>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hosting now</Text>
                    <View style={[styles.dot, { backgroundColor: '#27864A' }]} />
                  </View>
                  {active.map(b => renderBookingRow(b, 'Stay'))}
                </WKCard>
              ) : null}

              {/* Pending requests */}
              {pending.length > 0 ? (
                <WKCard variant="gold">
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pending requests</Text>
                    <Text style={styles.badge}>{pending.length}</Text>
                  </View>
                  {pending.slice(0, 3).map(b => renderBookingRow(b, ''))}
                  {pending.length > 3 ? (
                    <TouchableOpacity onPress={() => router.push('/(tabs)/me/hosting/requests' as any)}>
                      <Text style={styles.seeAllLink}>See all {pending.length} requests →</Text>
                    </TouchableOpacity>
                  ) : null}
                </WKCard>
              ) : null}

              {/* Upcoming arrivals */}
              {upcoming.length > 0 ? (
                <WKCard>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Arriving in the next 7 days</Text>
                  </View>
                  {upcoming.map(b => renderBookingRow(b, ''))}
                </WKCard>
              ) : null}

              {/* No activity yet */}
              {pending.length === 0 && active.length === 0 && upcoming.length === 0 ? (
                <WKCard>
                  <View style={styles.quietBlock}>
                    <Ionicons name="leaf-outline" size={28} color={colors.amberLine} />
                    <Text style={styles.quietTitle}>All quiet</Text>
                    <Text style={styles.quietBody}>
                      No requests right now. Wanderkinder discover you on the map and
                      send a Roof Tonight when they're close.
                    </Text>
                  </View>
                </WKCard>
              ) : null}

              {/* My listings — small reminder of what they have */}
              {listings.length > 0 ? (
                <WKCard variant="parchment">
                  <Text style={styles.sectionTitle}>Your listings</Text>
                  {listings.map(l => (
                    <TouchableOpacity
                      key={l.id}
                      style={styles.listingRow}
                      onPress={() => router.push('/(tabs)/me/hosting/listing-edit' as any)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={l.category === 'free' ? 'gift-outline' : 'heart-outline'}
                        size={18}
                        color={l.category === 'free' ? '#3F6112' : colors.amber}
                      />
                      <Text style={styles.listingName}>{l.name}</Text>
                      <View style={[styles.catChip, {
                        backgroundColor: l.category === 'free' ? '#E2EFD9' : '#FBEFD9',
                      }]}>
                        <Text style={[styles.catChipText, {
                          color: l.category === 'free' ? '#3F6112' : '#8C6010',
                        }]}>{(l.category ?? '—').toUpperCase()}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                    </TouchableOpacity>
                  ))}
                </WKCard>
              ) : null}

              {/* Quick actions */}
              <Text style={styles.quickHeader}>Quick actions</Text>
              <View style={styles.actionsGrid}>
                {[
                  { label: 'Requests',      icon: 'mail-unread' as const, route: '/(tabs)/me/hosting/requests' },
                  { label: 'Calendar',      icon: 'calendar' as const,   route: '/(tabs)/me/hosting/calendar' },
                  { label: 'Edit listing',  icon: 'pencil' as const,     route: '/(tabs)/me/hosting/listing-edit' },
                  { label: 'Gästebuch',     icon: 'book-outline' as const, route: '/(tabs)/me/hosting/gaestebuch' },
                ].map((action, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.actionCard}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={styles.actionIconBox}>
                      <Ionicons name={action.icon} size={26} color={colors.amber} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },

  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center', marginTop: spacing.md },
  emptyBody: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, padding: 0 },
  statContent: { alignItems: 'center', paddingVertical: spacing.md, gap: 4 },
  statValue: { ...typography.h2, color: colors.ink, marginTop: 4 },
  statLabel: { ...typography.caption, color: colors.ink3, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badge: {
    fontSize: 11, fontWeight: '800', color: '#fff', backgroundColor: colors.amber,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden',
  },

  guestItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLt,
  },
  guestAvatar: {
    width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  guestAvatarImg: { width: '100%', height: '100%' },
  guestInfo: { flex: 1 },
  guestName: { ...typography.bodySm, fontWeight: '600', color: colors.ink },
  guestDates: { fontSize: 11, color: colors.ink3, marginTop: 2 },

  seeAllLink: {
    fontSize: 12, fontWeight: '600', color: colors.amber, marginTop: spacing.sm,
    textAlign: 'center',
  },

  quietBlock: { alignItems: 'center', paddingVertical: spacing.md, gap: 6 },
  quietTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink },
  quietBody: {
    ...typography.caption, color: colors.ink2, textAlign: 'center',
    lineHeight: 16, paddingHorizontal: 12,
  },

  listingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLt,
  },
  listingName: { flex: 1, ...typography.bodySm, color: colors.ink },
  catChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  catChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },

  quickHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase', marginTop: 4,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: {
    flexBasis: '47%', backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.md, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.borderLt,
  },
  actionIconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.amberBg,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { ...typography.bodySm, color: colors.ink, fontWeight: '600' },
});
