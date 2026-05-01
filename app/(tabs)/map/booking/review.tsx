/**
 * WK-144 — Post-stay review screen
 * Fetches the real booking + host from DB, writes a stamp row and an
 * optional Gaestebuch entry, then marks the booking completed.
 *
 * Route params: bookingId (string, required)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKInput } from '../../../src/components/ui/WKInput';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useAuthStore } from '../../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';

type BookingMini = {
  id: string;
  host_id: string;
  walker_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type HostMini = {
  id: string;
  name: string;
  category: string | null;
  avatar_url?: string | null;
};

const formatPretty = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function BookingReview() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const profile = useAuthStore((s: any) => s.profile);
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId as string | undefined;

  const [booking, setBooking] = useState<BookingMini | null>(null);
  const [host, setHost] = useState<HostMini | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [addGaestebuch, setAddGaestebuch] = useState(false);
  const [gaestebuchMsg, setGaestebuchMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoadingData(true);
    try {
      const { data: b } = await supabase
        .from('bookings')
        .select('id, host_id, walker_id, start_date, end_date, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (!b) return;
      setBooking(b as BookingMini);

      const { data: h } = await supabase
        .from('hosts')
        .select('id, name, category')
        .eq('id', (b as BookingMini).host_id)
        .maybeSingle();

      setHost(h as HostMini | null);
    } finally {
      setLoadingData(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (rating === 0 || !booking || !host || !user) return;
    setSubmitting(true);
    try {
      const walkerName = profile?.trail_name ?? 'Wanderkind';

      // 1. Insert stamp (records the stay + review note)
      const { error: stampErr } = await supabase.from('stamps').insert({
        walker_id: user.id,
        host_id: host.id,
        host_name: host.name,
        booking_id: booking.id,
        rating,
        note: note.trim() || null,
      });

      if (stampErr) {
        toast.error('Could not save your stamp. Please try again.');
        return;
      }

      // 2. Optional Gaestebuch entry
      if (addGaestebuch && gaestebuchMsg.trim()) {
        await supabase.from('gaestebuch').insert({
          host_id: host.id,
          walker_id: user.id,
          walker_name: walkerName,
          message: gaestebuchMsg.trim(),
          rating,
        });
      }

      // 3. Mark booking completed
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', booking.id);

      // 4. Increment walker's stamps_count + nights_walked
      await supabase.rpc('increment_profile_counters', {
        p_id: user.id,
        nights_delta: 1,
        stamps_delta: 1,
      }).then(() => {/* best-effort */});

      toast.success('Stay stamped! Your review is published.');
      router.replace('/(tabs)/map/booking/history' as any);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? colors.gold : colors.ink3}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (authLoading || loadingData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Leave a Review" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking || !host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Leave a Review" showBack />
        <WKEmpty
          icon="alert-circle-outline"
          title="Booking not found"
          message="We couldn't load this stay. It may have been removed."
        />
      </SafeAreaView>
    );
  }

  // Already reviewed — don't let them submit twice
  if (booking.status === 'completed') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Leave a Review" showBack />
        <WKEmpty
          icon="checkmark-circle-outline"
          title="Already reviewed"
          message="You've already stamped this stay. Thank you!"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Leave a Review" showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Host Info */}
          <WKCard variant="parchment">
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Ionicons name="home" size={24} color={colors.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName} numberOfLines={2}>{host.name}</Text>
                <Text style={styles.stayDates}>
                  {formatPretty(booking.start_date)}
                  {booking.end_date ? ` → ${formatPretty(booking.end_date)}` : ''}
                </Text>
              </View>
            </View>
          </WKCard>

          {/* Star Rating */}
          <WKCard>
            <Text style={styles.sectionLabel}>How was your stay?</Text>
            <StarRating />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating - 1]}</Text>
            )}
          </WKCard>

          {/* Review Note */}
          <WKCard>
            <Text style={styles.sectionLabel}>Your note</Text>
            <Text style={styles.hint}>Optional — share your experience</Text>
            <WKInput
              placeholder="Tell others about your stay..."
              multiline
              numberOfLines={5}
              value={note}
              onChangeText={setNote}
              style={styles.reviewInput}
            />
          </WKCard>

          {/* Gaestebuch Toggle */}
          <WKCard>
            <View style={styles.gaestebuchRow}>
              <View style={styles.gaestebuchText}>
                <Text style={styles.gaestebuchTitle}>Add to Gästebuch</Text>
                <Text style={styles.gaestebuchHint}>
                  Leave a message in the host's guestbook
                </Text>
              </View>
              <Switch
                value={addGaestebuch}
                onValueChange={setAddGaestebuch}
                trackColor={{ false: colors.border, true: colors.gold }}
                thumbColor={addGaestebuch ? colors.amber : colors.ink3}
              />
            </View>
          </WKCard>

          {/* Gaestebuch Message */}
          {addGaestebuch && (
            <WKCard variant="gold">
              <Text style={styles.sectionLabel}>Gästebuch entry</Text>
              <Text style={styles.hint}>
                A public message for the host's guestbook
              </Text>
              <WKInput
                placeholder="Write a message for the guestbook..."
                multiline
                numberOfLines={4}
                value={gaestebuchMsg}
                onChangeText={setGaestebuchMsg}
                style={styles.reviewInput}
              />
            </WKCard>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={colors.ink2} />
            <Text style={styles.infoText}>
              Your review will be published on the host's profile and help the Wanderkind community.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <WKButton
          title={submitting ? 'Submitting…' : 'Submit Review'}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          loading={submitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screenPx,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: { ...typography.h3, color: colors.ink, marginBottom: 4 },
  stayDates: { ...typography.bodySm, color: colors.ink2 },
  sectionLabel: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  hint: { ...typography.bodySm, color: colors.ink2, marginBottom: spacing.md },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  starBtn: { padding: spacing.xs },
  ratingLabel: {
    ...typography.body,
    color: colors.amber,
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewInput: { minHeight: 100, paddingVertical: spacing.md },
  gaestebuchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaestebuchText: { flex: 1 },
  gaestebuchTitle: { ...typography.h3, color: colors.ink, marginBottom: 4 },
  gaestebuchHint: { ...typography.bodySm, color: colors.ink2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.parchment,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  infoText: { ...typography.bodySm, color: colors.ink, flex: 1, lineHeight: 19 },
});
