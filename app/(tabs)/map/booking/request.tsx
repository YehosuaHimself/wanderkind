/**
 * Booking · Request — WK-140
 * Walker selects host (from hostId param), picks dates with +/- steppers,
 * writes a message, submits → INSERT into bookings(status='pending').
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, isEmpty, enforceMaxLength, canPerformAction } from '../../../src/lib/validate';

const MSG_MAX = 600;

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso: string, n: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const formatPretty = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

type Host = {
  id: string;
  name: string;
  category: string | null;
  capacity: number | null;
  profile_id: string | null;
  is_available: boolean;
  hidden_from_map: boolean;
};

export default function BookingRequest() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams<{ hostId?: string }>();
  const { profile } = useAuth();

  const hostId = params.hostId as string | undefined;
  const [host, setHost] = useState<Host | null>(null);
  const [hostLoading, setHostLoading] = useState(true);

  const [checkIn, setCheckIn] = useState(addDaysISO(todayISO(), 1));
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 2));
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hostId) { setHostLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('hosts')
          .select('id, name, category, capacity, profile_id, is_available, hidden_from_map')
          .eq('id', hostId)
          .maybeSingle();
        setHost(data as Host | null);
      } finally {
        setHostLoading(false);
      }
    })();
  }, [hostId]);

  const stepCheckIn = (delta: number) => {
    const next = addDaysISO(checkIn, delta);
    if (next < todayISO()) return;                // can't book the past
    setCheckIn(next);
    if (next >= checkOut) setCheckOut(addDaysISO(next, 1));
  };
  const stepCheckOut = (delta: number) => {
    const next = addDaysISO(checkOut, delta);
    if (next <= checkIn) return;                  // must be after check-in
    setCheckOut(next);
  };

  const numNights = useMemo(() => {
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  }, [checkIn, checkOut]);

  const charsLeft = MSG_MAX - message.length;
  const overLimit = charsLeft < 0;

  const canSubmit = !!user
    && !!host
    && host.is_available && !host.hidden_from_map
    && !!message.trim()
    && !overLimit
    && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !host) return;
    if (isEmpty(message)) { toast.error('Add a short message to the host'); return; }
    if (!enforceMaxLength(message, MSG_MAX)) { toast.error(`Max ${MSG_MAX} chars`); return; }
    if (!canPerformAction('book-request', 2000)) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          host_id: host.id,
          walker_id: user.id,
          status: 'pending',
          start_date: checkIn,
          end_date: checkOut,
          message: sanitizeText(message),
          guests,
        })
        .select('id')
        .single();
      if (error) throw error;
      toast.success('Request sent — your host will respond.');
      router.replace({
        pathname: '/(tabs)/map/booking/confirm',
        params: { bookingId: (data as any).id },
      } as any);
    } catch (err: any) {
      console.error('booking request failed', err);
      toast.error(err?.message ?? 'Could not send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || hostLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Request stay" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Request stay" showBack />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.ink3} />
          <Text style={styles.errTitle}>Host not found</Text>
          <Text style={styles.errBody}>This listing may have been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!host.is_available || host.hidden_from_map) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Request stay" showBack />
        <View style={styles.center}>
          <Ionicons name="moon-outline" size={36} color={colors.ink3} />
          <Text style={styles.errTitle}>Host is sleeping</Text>
          <Text style={styles.errBody}>This Wanderhost is not accepting new requests right now.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Request stay" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Host card */}
        <WKCard variant="parchment">
          <View style={styles.hostInfo}>
            <Ionicons
              name={host.category === 'free' ? 'gift' : host.category === 'donativo' ? 'heart' : 'home'}
              size={36}
              color={host.category === 'free' ? '#3F6112' : host.category === 'donativo' ? '#8C6010' : colors.amber}
            />
            <View style={styles.hostText}>
              <Text style={styles.hostLabel}>Requesting a stay at</Text>
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

        {/* Check-in stepper */}
        <WKCard>
          <Text style={styles.sectionLabel}>Check-in</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity onPress={() => stepCheckIn(-1)} style={styles.stepBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Ionicons name="chevron-back" size={18} color={colors.amber} />
            </TouchableOpacity>
            <View style={styles.dateLabel}>
              <Ionicons name="calendar" size={18} color={colors.amber} />
              <Text style={styles.dateText}>{formatPretty(checkIn)}</Text>
            </View>
            <TouchableOpacity onPress={() => stepCheckIn(1)} style={styles.stepBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Ionicons name="chevron-forward" size={18} color={colors.amber} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickRow}>
            {[1, 3, 7].map(n => (
              <TouchableOpacity
                key={n}
                style={styles.quickChip}
                onPress={() => {
                  const d = addDaysISO(todayISO(), n);
                  setCheckIn(d);
                  if (d >= checkOut) setCheckOut(addDaysISO(d, 1));
                }}
              >
                <Text style={styles.quickChipText}>in {n} day{n>1?'s':''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WKCard>

        {/* Check-out stepper */}
        <WKCard>
          <Text style={styles.sectionLabel}>Check-out</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity onPress={() => stepCheckOut(-1)} style={styles.stepBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Ionicons name="chevron-back" size={18} color={colors.amber} />
            </TouchableOpacity>
            <View style={styles.dateLabel}>
              <Ionicons name="log-out" size={18} color={colors.amber} />
              <Text style={styles.dateText}>{formatPretty(checkOut)}</Text>
            </View>
            <TouchableOpacity onPress={() => stepCheckOut(1)} style={styles.stepBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Ionicons name="chevron-forward" size={18} color={colors.amber} />
            </TouchableOpacity>
          </View>
          <Text style={styles.nightsHint}>{numNights} night{numNights>1?'s':''}</Text>
        </WKCard>

        {/* Guests stepper */}
        {(host.capacity ?? 1) > 1 ? (
          <WKCard>
            <Text style={styles.sectionLabel}>Walkers</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity onPress={() => setGuests(g => Math.max(1, g - 1))} style={styles.stepBtn}>
                <Ionicons name="remove" size={18} color={colors.amber} />
              </TouchableOpacity>
              <View style={styles.dateLabel}>
                <Ionicons name="people" size={18} color={colors.amber} />
                <Text style={styles.dateText}>{guests} {guests===1?'walker':'walkers'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setGuests(g => Math.min(host.capacity ?? 10, g + 1))}
                style={styles.stepBtn}
                disabled={guests >= (host.capacity ?? 10)}
              >
                <Ionicons name="add" size={18} color={guests >= (host.capacity ?? 10) ? colors.ink3 : colors.amber} />
              </TouchableOpacity>
            </View>
            <Text style={styles.nightsHint}>This host can welcome up to {host.capacity}</Text>
          </WKCard>
        ) : null}

        {/* Message */}
        <WKCard>
          <Text style={styles.sectionLabel}>Message to your host</Text>
          <TextInput
            style={[styles.message, overLimit && { borderColor: colors.red }]}
            placeholder="Hi — I'm walking the way and would love to stay one night. Tell them who you are and when you'll arrive."
            placeholderTextColor={colors.ink3}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={MSG_MAX + 50}
          />
          <Text style={[styles.counter, overLimit && { color: colors.red }]}>{charsLeft}</Text>
        </WKCard>
      </ScrollView>

      {/* Submit footer */}
      <View style={styles.footer}>
        <WKButton
          title={submitting ? 'Sending…' : 'Send request'}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
        />
        <Text style={styles.footnote}>
          {host.category === 'free'
            ? 'Wanderhost — no money expected.'
            : host.category === 'donativo'
              ? 'Donativo — pay what you can.'
              : 'Under €50 a night.'}
          {' '}You will hear back within a day.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.md },

  errTitle: { ...typography.h3, color: colors.ink, marginTop: 8 },
  errBody: { ...typography.bodySm, color: colors.ink2, textAlign: 'center' },

  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hostText: { flex: 1 },
  hostLabel: { fontSize: 11, color: colors.ink3, letterSpacing: 1, textTransform: 'uppercase' },
  hostName: { ...typography.h2, color: colors.ink, marginTop: 4 },
  hostCat: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase', marginBottom: spacing.md,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amberBg,
    alignItems: 'center', justifyContent: 'center',
  },
  dateLabel: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 8, backgroundColor: colors.surfaceAlt, borderRadius: 10,
  },
  dateText: { ...typography.bodySm, color: colors.ink, fontWeight: '600' },
  nightsHint: { ...typography.caption, color: colors.ink3, textAlign: 'center', marginTop: 8 },

  quickRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 },
  quickChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLt,
  },
  quickChipText: { fontSize: 11, color: colors.ink2, fontWeight: '600' },

  message: {
    backgroundColor: colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink,
    minHeight: 110, textAlignVertical: 'top',
    borderWidth: 1, borderColor: 'transparent',
  },
  counter: {
    fontSize: 11, color: colors.ink3, alignSelf: 'flex-end', marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },

  footer: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.surface,
  },
  footnote: {
    ...typography.caption, color: colors.ink3, textAlign: 'center',
    marginTop: 8, lineHeight: 16,
  },
});
