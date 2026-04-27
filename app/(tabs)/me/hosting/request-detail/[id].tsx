/**
 * Hosting · Request Detail — WK-132
 * Real fetch of a booking + walker + host listing. Accept moves the
 * booking to 'confirmed' and idempotently issues a stamp tied to the
 * walker, host, and route. Decline marks 'declined'.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Image, TouchableOpacity, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../../../src/lib/supabase';
import { toast } from '../../../../../src/lib/toast';

type Booking = {
  id: string;
  host_id: string;
  walker_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  message: string | null;
  created_at: string;
};

type Walker = {
  id: string;
  trail_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tier: string | null;
  nights_walked: number | null;
  stamps_count: number | null;
};

type Host = {
  id: string;
  name: string;
  category: string | null;
  route_id: string | null;
  profile_id: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.amber,
  confirmed: '#27864A',
  declined: '#B6562A',
  cancelled: colors.ink3,
  completed: '#7A8896',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RequestDetail() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const requestId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [walker, setWalker] = useState<Walker | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'accept' | 'decline' | null>(null);

  const loadAll = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const { data: bookingData, error: bErr } = await supabase
        .from('bookings').select('*').eq('id', requestId).maybeSingle();
      if (bErr) throw bErr;
      if (!bookingData) { setBooking(null); return; }
      setBooking(bookingData as Booking);

      const [walkerRes, hostRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, trail_name, avatar_url, bio, tier, nights_walked, stamps_count')
          .eq('id', bookingData.walker_id).maybeSingle(),
        supabase.from('hosts')
          .select('id, name, category, route_id, profile_id')
          .eq('id', bookingData.host_id).maybeSingle(),
      ]);
      setWalker(walkerRes.data as Walker | null);
      setHost(hostRes.data as Host | null);
    } catch (err) {
      console.error('load request failed', err);
      toast.error('Could not load request');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDecline = async () => {
    if (!booking || acting) return;
    setActing('decline');
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'declined' })
        .eq('id', booking.id);
      if (error) throw error;
      setBooking({ ...booking, status: 'declined' });
      toast.success('Request declined');
    } catch (err: any) {
      console.error('decline failed', err);
      toast.error(err?.message ?? 'Could not decline');
    } finally {
      setActing(null);
    }
  };

  const handleAccept = async () => {
    if (!booking || !walker || !host || acting) return;
    setActing('accept');
    try {
      // Move booking → confirmed
      const { error: bErr } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);
      if (bErr) throw bErr;

      // Idempotent stamp: skip if a stamp already exists for this (walker, host) pair
      const { data: existing } = await supabase
        .from('stamps')
        .select('id')
        .eq('walker_id', booking.walker_id)
        .eq('host_id', booking.host_id)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { error: sErr } = await supabase.from('stamps').insert({
          walker_id: booking.walker_id,
          host_id: booking.host_id,
          host_name: host.name,
          route_id: host.route_id ?? null,
        });
        if (sErr) {
          console.warn('stamp insert failed', sErr);
          // Don't block the accept on stamp failure
        }
      }

      setBooking({ ...booking, status: 'confirmed' });
      toast.success('Accepted — a stamp has been issued.');
    } catch (err: any) {
      console.error('accept failed', err);
      toast.error(err?.message ?? 'Could not accept');
    } finally {
      setActing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Request" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Request" showBack />
        <WKEmpty icon="alert-circle-outline" title="Request not found" message="This booking request may have been deleted or you do not have access." />
      </SafeAreaView>
    );
  }

  const status = booking.status;
  const isFinal = status === 'declined' || status === 'cancelled' || status === 'completed';
  const isConfirmed = status === 'confirmed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Request" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[status] ?? colors.ink3}18`, borderColor: STATUS_COLOR[status] ?? colors.ink3 }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] ?? colors.ink3 }]} />
          <Text style={[styles.statusText, { color: STATUS_COLOR[status] ?? colors.ink3 }]}>
            {STATUS_LABEL[status] ?? status.toUpperCase()}
          </Text>
          <Text style={styles.statusSub}>· received {formatDate(booking.created_at)}</Text>
        </View>

        {/* Walker card */}
        <WKCard variant="gold">
          <TouchableOpacity
            style={styles.profileHeader}
            onPress={() => walker?.id && router.push(`/(tabs)/me/profile/${walker.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarBox}>
              {walker?.avatar_url ? (
                <Image source={{ uri: walker.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={28} color={colors.ink3} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{walker?.trail_name ?? 'Wanderkind'}</Text>
              {walker?.tier ? (
                <Text style={styles.tier}>{walker.tier.toUpperCase()}</Text>
              ) : null}
              <View style={styles.statsRow}>
                {walker?.nights_walked != null ? (
                  <View style={styles.stat}>
                    <Ionicons name="footsteps" size={13} color={colors.amber} />
                    <Text style={styles.statText}>{walker.nights_walked} nights</Text>
                  </View>
                ) : null}
                {walker?.stamps_count != null ? (
                  <View style={styles.stat}>
                    <Ionicons name="ribbon" size={13} color={colors.amber} />
                    <Text style={styles.statText}>{walker.stamps_count} stamps</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
          </TouchableOpacity>
        </WKCard>

        {/* Dates */}
        <WKCard>
          <Text style={styles.sectionTitle}>Requested dates</Text>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={20} color={colors.amber} />
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(booking.start_date)}</Text>
            </View>
          </View>
          <View style={[styles.dateItem, styles.dateDivider]}>
            <Ionicons name="log-out" size={20} color={colors.amber} />
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(booking.end_date)}</Text>
            </View>
          </View>
        </WKCard>

        {/* Walker's message */}
        {booking.message ? (
          <WKCard>
            <Text style={styles.sectionTitle}>Walker's message</Text>
            <Text style={styles.messageText}>{booking.message}</Text>
          </WKCard>
        ) : null}

        {/* Host listing */}
        {host ? (
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>For your listing</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Listing</Text>
              <Text style={styles.infoValue}>{host.name}</Text>
            </View>
            {host.category ? (
              <View style={[styles.infoRow, styles.infoDivider]}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={[styles.infoValue, {
                  color: host.category === 'free' ? '#3F6112'
                       : host.category === 'donativo' ? '#8C6010' : colors.ink2,
                  textTransform: 'uppercase',
                  fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
                  letterSpacing: 1,
                }]}>{host.category}</Text>
              </View>
            ) : null}
          </WKCard>
        ) : null}
      </ScrollView>

      {/* Action footer */}
      {!isFinal && status !== 'confirmed' ? (
        <View style={styles.footer}>
          <WKButton
            title={acting === 'decline' ? 'Declining…' : 'Decline'}
            onPress={handleDecline}
            variant="outline"
            fullWidth
            disabled={!!acting}
            style={{ marginBottom: spacing.md }}
          />
          <WKButton
            title={acting === 'accept' ? 'Accepting…' : 'Accept request'}
            onPress={handleAccept}
            fullWidth
            loading={acting === 'accept'}
            disabled={!!acting}
          />
        </View>
      ) : isConfirmed ? (
        <View style={styles.footer}>
          <View style={styles.confirmedBlock}>
            <Ionicons name="checkmark-circle" size={20} color="#27864A" />
            <Text style={styles.confirmedText}>
              Confirmed. A stamp has been issued — your guest can see it on their pass.
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },
  statusSub: { fontSize: 11, color: colors.ink3, marginLeft: 4 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarBox: {
    width: 56, height: 56, borderRadius: radii.full, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  name: { ...typography.h3, color: colors.ink },
  tier: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: colors.amber, marginTop: 2,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: colors.ink2 },

  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase', marginBottom: spacing.md,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },

  dateItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dateDivider: { borderTopWidth: 1, borderTopColor: colors.borderLt },
  dateContent: { flex: 1 },
  dateLabel: { fontSize: 11, color: colors.ink3 },
  dateValue: { ...typography.bodySm, color: colors.ink, fontWeight: '600', marginTop: 2 },

  messageText: { ...typography.body, color: colors.ink2, lineHeight: 22, fontStyle: 'italic' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  infoDivider: { borderTopWidth: 1, borderTopColor: colors.borderLt },
  infoLabel: { ...typography.caption, color: colors.ink3 },
  infoValue: { ...typography.bodySm, color: colors.ink, fontWeight: '600' },

  footer: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.borderLt,
  },
  confirmedBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E2EFD9', paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#27864A',
  },
  confirmedText: { flex: 1, fontSize: 13, color: '#3F6112', lineHeight: 18 },
});
