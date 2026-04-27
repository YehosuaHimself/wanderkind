/**
 * Hosting · Calendar — WK-131
 * Real month grid driven by Supabase: bookings (confirmed nights are
 * coloured 'booked'), host_availability (manually blocked nights), and
 * past dates greyed out. Tap a future date to toggle a block on it.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../../src/lib/supabase';
import { toast } from '../../../../src/lib/toast';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['M','T','W','T','F','S','S']; // Monday-first

type DayState = 'past' | 'available' | 'blocked' | 'booked';

const isoDate = (y: number, m0: number, d: number) => {
  const mm = String(m0 + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function dateRange(start: string, end: string): string[] {
  // Inclusive of start, exclusive of end (one-night-stay convention)
  const out: string[] = [];
  const s = new Date(start), e = new Date(end);
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  if (out.length === 0) out.push(start); // single-night fallback
  return out;
}

export default function HostingCalendar() {
  const { user, isLoading: authLoading } = useAuthGuard();

  const [listings, setListings] = useState<Array<{ id: string; name: string }>>([]);
  const [activeHostId, setActiveHostId] = useState<string | null>(null);
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load listings
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('hosts')
        .select('id, name')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      const my = (data as Array<{ id: string; name: string }>) || [];
      setListings(my);
      if (my.length > 0) setActiveHostId(my[0].id);
      else setLoading(false);
    })();
  }, [user]);

  const loadCalendarData = useCallback(async () => {
    if (!activeHostId) return;
    setLoading(true);
    try {
      const [bookingsRes, blocksRes] = await Promise.all([
        supabase.from('bookings')
          .select('start_date, end_date, status')
          .eq('host_id', activeHostId)
          .in('status', ['confirmed', 'pending']),
        supabase.from('host_availability')
          .select('blocked_on')
          .eq('host_id', activeHostId),
      ]);
      const booked = new Set<string>();
      for (const b of (bookingsRes.data as any[]) || []) {
        if (!b.start_date) continue;
        const end = b.end_date || b.start_date;
        for (const d of dateRange(b.start_date, end)) booked.add(d);
      }
      setBookedSet(booked);
      setBlockedSet(new Set(((blocksRes.data as any[]) || []).map(r => r.blocked_on)));
    } finally {
      setLoading(false);
    }
  }, [activeHostId]);

  useEffect(() => { loadCalendarData(); }, [loadCalendarData]);

  const dayState = (dateStr: string): DayState => {
    if (dateStr < todayISO()) return 'past';
    if (bookedSet.has(dateStr)) return 'booked';
    if (blockedSet.has(dateStr)) return 'blocked';
    return 'available';
  };

  const toggleBlock = async (dateStr: string) => {
    if (!activeHostId || saving) return;
    const state = dayState(dateStr);
    if (state === 'past' || state === 'booked') return;

    setSaving(true);
    const willBlock = state === 'available';
    // Optimistic
    setBlockedSet(prev => {
      const next = new Set(prev);
      if (willBlock) next.add(dateStr); else next.delete(dateStr);
      return next;
    });

    try {
      if (willBlock) {
        await supabase.from('host_availability').insert({
          host_id: activeHostId,
          blocked_on: dateStr,
        });
      } else {
        await supabase.from('host_availability')
          .delete()
          .eq('host_id', activeHostId)
          .eq('blocked_on', dateStr);
      }
    } catch (err) {
      // Rollback
      setBlockedSet(prev => {
        const next = new Set(prev);
        if (willBlock) next.delete(dateStr); else next.add(dateStr);
        return next;
      });
      toast.error('Could not update availability');
    } finally {
      setSaving(false);
    }
  };

  const monthDays = useMemo(() => {
    const { y, m } = cursor;
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Monday-first offset (0..6)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<{ d: number | null; iso?: string }> = [];
    for (let i = 0; i < startOffset; i++) cells.push({ d: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ d, iso: isoDate(y, m, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ d: null });
    return cells;
  }, [cursor]);

  const stepMonth = (delta: number) => {
    setCursor(prev => {
      const next = new Date(prev.y, prev.m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  };

  if (authLoading || (loading && !activeHostId)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Calendar" showBack />
        <View style={styles.center}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!activeHostId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Calendar" showBack />
        <WKEmpty
          icon="calendar-outline"
          title="No listing yet"
          message="Claim a Wanderhost listing first — then your nights live here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Calendar" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Listing picker (only if >1) */}
        {listings.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
            {listings.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setActiveHostId(l.id)}
                style={[
                  styles.pickerChip,
                  activeHostId === l.id && styles.pickerChipActive,
                ]}
              >
                <Text style={[
                  styles.pickerText,
                  activeHostId === l.id && styles.pickerTextActive,
                ]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => stepMonth(-1)} style={styles.monthNavBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={20} color={colors.amber} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[cursor.m]} {cursor.y}</Text>
          <TouchableOpacity onPress={() => stepMonth(1)} style={styles.monthNavBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={20} color={colors.amber} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week header */}
        <View style={styles.dowRow}>
          {DAY_NAMES.map((d, i) => (
            <Text key={i} style={styles.dowText}>{d}</Text>
          ))}
        </View>

        {/* Day grid */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.amber} /></View>
        ) : (
          <View style={styles.grid}>
            {monthDays.map((cell, idx) => {
              if (cell.d == null) return <View key={idx} style={styles.dayCell} />;
              const state = dayState(cell.iso!);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    state === 'past'      && styles.dayPast,
                    state === 'available' && styles.dayAvail,
                    state === 'blocked'   && styles.dayBlocked,
                    state === 'booked'    && styles.dayBooked,
                  ]}
                  onPress={() => toggleBlock(cell.iso!)}
                  activeOpacity={0.6}
                  disabled={state === 'past' || state === 'booked'}
                >
                  <Text style={[
                    styles.dayText,
                    state === 'past'    && { color: colors.ink3 },
                    state === 'blocked' && { color: '#fff', fontWeight: '700' },
                    state === 'booked'  && { color: '#fff', fontWeight: '700' },
                  ]}>
                    {cell.d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Legend */}
        <WKCard variant="parchment" style={{ marginTop: spacing.lg }}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, styles.dayAvail]} />
            <Text style={styles.legendText}>Available — Wanderkinder can book this night</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, styles.dayBlocked]} />
            <Text style={styles.legendText}>Blocked — manually closed by you</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, styles.dayBooked]} />
            <Text style={styles.legendText}>Booked — there's a confirmed or pending stay</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, styles.dayPast]} />
            <Text style={styles.legendText}>Past — already gone</Text>
          </View>
          <Text style={styles.legendHint}>
            Tap a green night to block it. Tap an orange one to re-open it.
          </Text>
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_GAP = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },

  pickerRow: { gap: 8, paddingBottom: spacing.md },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  pickerChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pickerText: { fontSize: 12, fontWeight: '600', color: colors.ink2 },
  pickerTextActive: { color: '#FAF6EF' },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.amberBg,
  },
  monthTitle: { ...typography.h3, color: colors.ink },

  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dowText: {
    flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700',
    color: colors.ink3, letterSpacing: 1,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
  dayCell: {
    width: `${(100 / 7).toFixed(4)}%`,
    aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6,
  },
  dayText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  dayPast:    { backgroundColor: colors.surfaceAlt, opacity: 0.5 },
  dayAvail:   { backgroundColor: '#E2EFD9' },        // green
  dayBlocked: { backgroundColor: '#9C7148' },        // bronze
  dayBooked:  { backgroundColor: colors.amber },     // amber

  legendTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.ink3,
    textTransform: 'uppercase', marginBottom: spacing.md,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  legendSwatch: { width: 18, height: 18, borderRadius: 4 },
  legendText: { ...typography.bodySm, color: colors.ink2, flex: 1 },
  legendHint: {
    ...typography.caption, color: colors.ink3, marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
