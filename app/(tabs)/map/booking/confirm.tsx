/**
 * Booking · Confirm — WK-141
 * Walker landing screen after WK-140 sent the request. Real fetch +
 * Supabase realtime subscription so pending → confirmed / declined
 * transitions appear without a refresh. .ics export on confirm.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Platform, Linking,
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

type Host = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number;
  lng: number;
};

const STATUS_CONFIG: Record<string, {
  icon: 'time-outline' | 'checkmark-circle' | 'close-circle' | 'help-circle';
  title: string;
  color: string;
  message: string;
}> = {
  pending: {
    icon: 'time-outline',
    title: 'Request sent',
    color: '#C8762A',
    message: 'Your host is reading. Most respond within a day.',
  },
  confirmed: {
    icon: 'checkmark-circle',
    title: 'Stay confirmed',
    color: '#27864A',
    message: "You're booked. The host's contact details are below.",
  },
  declined: {
    icon: 'close-circle',
    title: 'Request declined',
    color: '#B6562A',
    message: 'The host could not accept this stay. Try another night or another door.',
  },
  cancelled: {
    icon: 'close-circle',
    title: 'Request cancelled',
    color: '#7A8896',
    message: 'This request has been cancelled.',
  },
  completed: {
    icon: 'checkmark-circle',
    title: 'Stay completed',
    color: '#7A8896',
    message: "Your stay is done. Don't forget to leave a Gästebuch entry.",
  },
};

const formatPretty = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const buildICS = (b: Booking, h: Host) => {
  // Minimal RFC5545 .ics for the stay
  const dtFmt = (iso: string | null) => iso ? iso.replace(/-/g, '') : '';
  const start = dtFmt(b.start_date);
  const end   = dtFmt(b.end_date) || start;
  const uid   = `${b.id}@wanderkind.love`;
  const desc  = (b.message ?? '').replace(/\n/g, ' ');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wanderkind//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:Wanderkind stay at ${h.name}`,
    `LOCATION:${(h.address ?? '').replace(/[,;]/g, ' ')}`,
    `GEO:${h.lat};${h.lng}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export default function BookingConfirm() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId as string | undefined;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data: b } = await supabase
        .from('bookings').select('*').eq('id', bookingId).maybeSingle();
      if (!b) { setBooking(null); return; }
      setBooking(b as Booking);
      const { data: h } = await supabase
        .from('hosts')
        .select('id, name, category, address, phone, email, website, lat, lng')
        .eq('id', (b as Booking).host_id).maybeSingle();
      setHost(h as Host | null);
    } catch (err) {
      console.error('confirm load failed', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime listener — flip the screen instantly when host accepts/declines
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `id=eq.${bookingId}`,
      }, (payload) => {
        const next = payload.new as Booking;
        setBooking(next);
        if (next.status === 'confirmed') toast.success('Confirmed by your host.');
        if (next.status === 'declined')  toast.error('Your request was declined.');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const exportICS = async () => {
    if (!booking || !host) return;
    const ics = buildICS(booking, host);
    if (Platform.OS === 'web') {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wanderkind-${host.name.replace(/[^a-z0-9]+/gi, '-').slice(0, 32)}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Calendar event exported');
    } else {
      // Native: use a data URL
      Linking.openURL(`data:text/calendar;base64,${btoa(unescape(encodeURIComponent(ics)))}`);
    }
  };

  const callHost = () => host?.phone && Linking.openURL(`tel:${host.phone}`);
  const emailHost = () => host?.email && Linking.openURL(`mailto:${host.email}`);
  const openWebsite = () => host?.website && Linking.openURL(host.website);
  const openDirections = () => host && Linking.openURL(
    Platform.OS === 'ios'
      ? `maps:?daddr=${host.lat},${host.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${host.lat},${host.lng}`,
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Booking" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Booking" showBack />
        <WKEmpty icon="alert-circle-outline" title="Booking not found" message="This request may have been removed." />
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const isConfirmed = booking.status === 'confirmed';
  const showHostContact = isConfirmed; // host details revealed only on confirm

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Booking" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Big status block */}
        <View style={styles.statusBlock}>
          <Ionicons name={cfg.icon} size={64} color={cfg.color} />
          <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.statusBody}>{cfg.message}</Text>
        </View>

        {/* Host card — name visible always; contact only on confirm */}
        {host ? (
          <WKCard variant="parchment">
            <View style={styles.hostRow}>
              <Ionicons
                name={host.category === 'free' ? 'gift' : host.category === 'donativo' ? 'heart' : 'home'}
                size={24}
                color={host.category === 'free' ? '#3F6112' : host.category === 'donativo' ? '#8C6010' : colors.amber}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>{host.name}</Text>
                {host.category ? (
                  <Text style={[styles.hostCat, {
                    color: host.category === 'free' ? '#3F6112'
                         : host.category === 'donativo' ? '#8C6010' : colors.ink2,
                  }]}>★ {host.category.toUpperCase()}</Text>
                ) : null}
              </View>
            </View>
          </WKCard>
        ) : null}

        {/* Dates */}
        <WKCard>
          <Text style={styles.sectionTitle}>Stay</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatPretty(booking.start_date)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.ink3} />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatPretty(booking.end_date)}</Text>
            </View>
          </View>
        </WKCard>

        {/* Message they sent */}
        {booking.message ? (
          <WKCard>
            <Text style={styles.sectionTitle}>Your message</Text>
            <Text style={styles.messageText}>"{booking.message}"</Text>
          </WKCard>
        ) : null}

        {/* Host contact — confirmed only */}
        {showHostContact && host ? (
          <WKCard variant="gold">
            <Text style={styles.sectionTitle}>Reaching your host</Text>
            <View style={styles.actionsRow}>
              {host.phone ? (
                <View style={styles.actionCol}>
                  <View style={styles.actionIcon}><Ionicons name="call" size={20} color="#27864A" /></View>
                  <Text style={styles.actionLabel} onPress={callHost}>{host.phone}</Text>
                </View>
              ) : null}
              {host.email ? (
                <View style={styles.actionCol}>
                  <View style={styles.actionIcon}><Ionicons name="mail" size={20} color={colors.amber} /></View>
                  <Text style={styles.actionLabel} onPress={emailHost} numberOfLines={1}>{host.email}</Text>
                </View>
              ) : null}
              {host.website ? (
                <View style={styles.actionCol}>
                  <View style={styles.actionIcon}><Ionicons name="globe" size={20} color={colors.amber} /></View>
                  <Text style={styles.actionLabel} onPress={openWebsite} numberOfLines={1}>website</Text>
                </View>
              ) : null}
              <View style={styles.actionCol}>
                <View style={styles.actionIcon}><Ionicons name="navigate" size={20} color={colors.amber} /></View>
                <Text style={styles.actionLabel} onPress={openDirections}>directions</Text>
              </View>
            </View>
            {host.address ? (
              <Text style={styles.addressLine}>{host.address}</Text>
            ) : null}
          </WKCard>
        ) : null}

      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        {isConfirmed ? (
          <WKButton
            title="Add to calendar (.ics)"
            onPress={exportICS}
            variant="primary"
            fullWidth
          />
        ) : booking.status === 'pending' ? (
          <WKButton
            title="Back to map"
            onPress={() => router.replace('/(tabs)/map' as any)}
            variant="outline"
            fullWidth
          />
        ) : (
          <WKButton
            title="Find another host"
            onPress={() => router.replace('/(tabs)/map' as any)}
            variant="primary"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },

  statusBlock: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  statusTitle: { ...typography.h2, marginTop: 8, textAlign: 'center' },
  statusBody: {
    ...typography.bodySm, color: colors.ink2, textAlign: 'center',
    paddingHorizontal: spacing.xl, lineHeight: 20,
  },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hostName: { ...typography.h3, color: colors.ink },
  hostCat: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },

  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase', marginBottom: spacing.md,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dateBox: { flex: 1, alignItems: 'center' },
  dateLabel: { ...typography.caption, color: colors.ink3 },
  dateValue: { ...typography.bodySm, color: colors.ink, fontWeight: '700', marginTop: 4 },

  messageText: { ...typography.body, color: colors.ink2, fontStyle: 'italic', lineHeight: 22 },

  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8,
  },
  actionCol: { width: '46%', alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amberBg,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { ...typography.bodySm, color: colors.amber, fontWeight: '600' },
  addressLine: { ...typography.caption, color: colors.ink2, marginTop: 8, textAlign: 'center' },

  footer: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.surface,
  },
});
