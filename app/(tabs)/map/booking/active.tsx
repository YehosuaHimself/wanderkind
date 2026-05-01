/**
 * WK-142 — Active / During-Stay screen
 * Shows real booking data: host contact, door code, house rules, dates.
 * Opened from confirm.tsx when booking status is 'confirmed'.
 * Realtime subscription flips the screen if status changes (e.g. host cancels).
 *
 * Route params: bookingId (string, required)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Clipboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';

type ActiveBooking = {
  id: string;
  host_id: string;
  walker_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  message: string | null;
  door_code: string | null;
  door_code_type: string | null;
  guests: number;
};

type Host = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  house_rules: string[];
  lat: number;
  lng: number;
};

const fmt = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

const daysUntil = (iso: string | null): string => {
  if (!iso) return '—';
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Checked in';
  if (diff === 0) return 'Today!';
  if (diff === 1) return '1 day';
  return `${diff} days`;
};

export default function BookingActive() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId as string | undefined;

  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data: b } = await supabase
        .from('bookings')
        .select('id, host_id, walker_id, status, start_date, end_date, message, door_code, door_code_type, guests')
        .eq('id', bookingId)
        .maybeSingle();
      if (!b) return;
      setBooking(b as ActiveBooking);

      const { data: h } = await supabase
        .from('hosts')
        .select('id, name, address, phone, email, website, house_rules, lat, lng')
        .eq('id', (b as ActiveBooking).host_id)
        .maybeSingle();
      setHost(h as Host | null);
    } catch (err) {
      console.error('active booking load failed', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime: react to status changes instantly ─────────────────────
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`active-booking-${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      }, (payload: any) => {
        const next = payload.new as ActiveBooking;
        setBooking(next);
        if (next.status === 'cancelled') {
          toast.error('This booking has been cancelled by the host.');
        }
        if (next.door_code && !booking?.door_code) {
          toast.success('Door code received!');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId, booking?.door_code]);

  const copyCode = () => {
    if (!booking?.door_code) return;
    Clipboard.setString(booking.door_code);
    toast.success('Door code copied!');
  };

  const openDirections = () => {
    if (!host) return;
    const url = Platform.OS === 'ios'
      ? `maps:?daddr=${host.lat},${host.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${host.lat},${host.lng}`;
    Linking.openURL(url);
  };

  const messageHost = async () => {
    if (!host || !user) return;
    // Find or create thread with the host's profile
    const { data: hostRow } = await supabase
      .from('hosts')
      .select('profile_id')
      .eq('id', host.id)
      .maybeSingle();
    if (hostRow?.profile_id) {
      router.push({
        pathname: '/(tabs)/messages/new',
        params: { userId: hostRow.profile_id },
      } as any);
    } else {
      router.push('/(tabs)/messages' as any);
    }
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Current Stay" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!booking || !host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Current Stay" showBack />
        <WKEmpty
          icon="alert-circle-outline"
          title="Stay not found"
          message="This booking could not be loaded."
        />
      </SafeAreaView>
    );
  }

  if (booking.status === 'cancelled' || booking.status === 'declined') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Current Stay" showBack />
        <WKEmpty
          icon="close-circle-outline"
          title="Stay cancelled"
          message="This booking is no longer active."
        />
      </SafeAreaView>
    );
  }

  const until = daysUntil(booking.start_date);
  const isCheckedIn = booking.start_date && new Date(booking.start_date) <= new Date();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Current Stay" showBack />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Countdown */}
          <WKCard variant="gold">
            <View style={styles.countdownRow}>
              <View>
                <Text style={styles.countdownLabel}>
                  {isCheckedIn ? 'Staying at' : 'Check-in in'}
                </Text>
                <Text style={styles.countdownValue}>{until}</Text>
                <Text style={styles.hostNameLg}>{host.name}</Text>
              </View>
              <Ionicons
                name={isCheckedIn ? 'home' : 'calendar-outline'}
                size={48}
                color={colors.gold}
              />
            </View>
          </WKCard>

          {/* Dates */}
          <WKCard>
            <Text style={styles.sectionTitle}>Stay dates</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{fmt(booking.start_date)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.ink3} />
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{fmt(booking.end_date)}</Text>
              </View>
            </View>
          </WKCard>

          {/* Door code */}
          {booking.door_code ? (
            <WKCard variant="parchment">
              <Text style={styles.sectionTitle}>Door Access</Text>
              <View style={styles.doorBox}>
                <Ionicons name="key" size={32} color={colors.amber} />
                <Text style={styles.doorLabel}>
                  {booking.door_code_type === 'pin' ? 'PIN Code'
                    : booking.door_code_type === 'keybox' ? 'Key Box Code'
                    : booking.door_code_type === 'combo' ? 'Combination'
                    : 'Door Code'}
                </Text>
                <Text style={styles.doorPin}>{booking.door_code}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
                  <Ionicons name="copy-outline" size={16} color={colors.amber} />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </WKCard>
          ) : (
            <WKCard variant="parchment">
              <Text style={styles.sectionTitle}>Door Access</Text>
              <Text style={styles.hint}>
                The host hasn't shared a door code yet. Message them for entry instructions.
              </Text>
            </WKCard>
          )}

          {/* Host contact */}
          <WKCard>
            <Text style={styles.sectionTitle}>Your Host</Text>
            <TouchableOpacity style={styles.actionRow} onPress={messageHost}>
              <View style={styles.actionIcon}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.amber} />
              </View>
              <Text style={styles.actionText}>Message {host.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </TouchableOpacity>
            {host.phone ? (
              <TouchableOpacity
                style={[styles.actionRow, styles.actionBorder]}
                onPress={() => Linking.openURL(`tel:${host.phone}`)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="call-outline" size={20} color={colors.amber} />
                </View>
                <Text style={styles.actionText}>{host.phone}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
              </TouchableOpacity>
            ) : null}
            {host.address ? (
              <TouchableOpacity
                style={[styles.actionRow, styles.actionBorder]}
                onPress={openDirections}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="navigate-outline" size={20} color={colors.amber} />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>{host.address}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
              </TouchableOpacity>
            ) : null}
          </WKCard>

          {/* House rules */}
          {host.house_rules?.length > 0 ? (
            <WKCard>
              <Text style={styles.sectionTitle}>House Rules</Text>
              {host.house_rules.map((r: string, i: number) => (
                <View key={i} style={styles.ruleRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.green} />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </WKCard>
          ) : null}
        </View>
      </ScrollView>

      {booking.status === 'completed' ? (
        <View style={styles.footer}>
          <WKButton
            title="Leave a Review"
            onPress={() => router.push({ pathname: '/(tabs)/map/booking/review', params: { bookingId: booking.id } } as any)}
            fullWidth
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.screenPx, paddingVertical: spacing.lg, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.screenPx, paddingBottom: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLt },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countdownLabel: { ...typography.bodySm, color: colors.ink2, marginBottom: 4 },
  countdownValue: { ...typography.h1, color: colors.ink },
  hostNameLg: { ...typography.bodySm, color: colors.amber, marginTop: 4, fontWeight: '600' },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  hint: { ...typography.bodySm, color: colors.ink2, lineHeight: 20 },
  datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dateBox: { flex: 1, alignItems: 'center' },
  dateLabel: { ...typography.caption, color: colors.ink3 },
  dateValue: { ...typography.bodySm, color: colors.ink, fontWeight: '700', marginTop: 4 },
  doorBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  doorLabel: { ...typography.bodySm, color: colors.ink2 },
  doorPin: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: 6, fontFamily: 'Courier New' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  copyText: { ...typography.bodySm, color: colors.amber, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  actionBorder: { borderTopWidth: 1, borderTopColor: colors.borderLt },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amberBg, justifyContent: 'center', alignItems: 'center' },
  actionText: { ...typography.body, color: colors.amber, flex: 1, fontWeight: '600' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  ruleText: { ...typography.bodySm, color: colors.ink, flex: 1 },
});
