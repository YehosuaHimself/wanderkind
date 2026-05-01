/**
 * WK-123 — arrival instructions. Persists hosts.arrival_instructions text.
 * Visible to walkers only after their booking is confirmed.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';

const MAX = 600;

export default function ArrivalInstructionsScreen() {
  const { user } = useAuthGuard();
  const [hostId, setHostId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => {
    if (!user) return;
    const { data } = await supabase.from('hosts')
      .select('id, arrival_instructions')
      .eq('profile_id', user.id).limit(1).maybeSingle();
    if (data) {
      setHostId(data.id);
      setText((data as any).arrival_instructions ?? '');
    }
    setLoading(false);
  })(); }, [user]);

  const save = async () => {
    if (!hostId) { toast.error('Claim your listing first'); return; }
    setSaving(true);
    haptic.medium();
    const { error } = await supabase.from('hosts')
      .update({ arrival_instructions: text.trim() || null } as any)
      .eq('id', hostId);
    setSaving(false);
    if (error) { toast.error('Could not save'); return; }
    toast.success('Instructions saved');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Arrival" showBack />
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }
  if (!hostId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Arrival" showBack />
        <View style={styles.empty}>
          <Ionicons name="navigate-outline" size={36} color={colors.amber} />
          <Text style={styles.emptyTitle}>Claim your listing first</Text>
          <Text style={styles.emptyBody}>Open MORE → Wanderhost → Become a Wanderhost.</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Arrival" showBack />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text style={styles.lead}>
          The "how to find me" note. Confirmed walkers see it on the day they arrive — no chasing messages, no missed doors.
        </Text>

        <View style={styles.helpRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.ink3} />
          <Text style={styles.helpText}>Visible only to walkers with a confirmed booking.</Text>
        </View>

        <TextInput
          multiline
          value={text}
          onChangeText={(v) => { if (v.length <= MAX) setText(v); }}
          placeholder={'e.g. "After the church, take the small alley on the left. Door is wooden, blue tile next to the bell. If I\'m not in, knock at the bakery — they have my key."'}
          placeholderTextColor={colors.ink3}
          style={styles.textarea}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{text.length} / {MAX}</Text>

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} onPress={save}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save instructions</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12 },
  emptyBody: { ...typography.body, color: colors.ink2, textAlign: 'center' },
  lead: { ...typography.body, color: colors.ink2, marginBottom: 12 },
  helpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16,
  },
  helpText: { ...typography.caption, color: colors.ink3 },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    minHeight: 200,
    ...typography.body,
    color: colors.ink,
  },
  counter: { ...typography.caption, color: colors.ink3, marginTop: 6, textAlign: 'right' },
  save: {
    marginTop: 20,
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
