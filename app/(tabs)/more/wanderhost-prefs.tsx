/**
 * WK-121 — Wanderhost preferences. Persists capacity, languages,
 * amenities, and house_rules to the host's row in `hosts`.
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

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Catalan', 'Basque', 'Dutch'];
const AMENITIES = ['kitchen', 'shower', 'wifi', 'laundry', 'pet_friendly', 'breakfast', 'dinner', 'storage', 'bicycle'];
const RULES = ['no_smoking', 'quiet_hours', 'no_pets', 'no_alcohol', 'curfew_22', 'shoes_off'];

export default function PreferencesScreen() {
  const { user } = useAuthGuard();
  const [hostId, setHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capacity, setCapacity] = useState<string>('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);

  useEffect(() => { (async () => {
    if (!user) return;
    const { data } = await supabase.from('hosts')
      .select('id, capacity, languages, amenities, house_rules')
      .eq('profile_id', user.id).limit(1).maybeSingle();
    if (data) {
      setHostId(data.id);
      setCapacity(String((data as any).capacity ?? ''));
      setLanguages((data as any).languages || []);
      setAmenities((data as any).amenities || []);
      setRules((data as any).house_rules || []);
    }
    setLoading(false);
  })(); }, [user]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) => {
    haptic.selection();
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const save = async () => {
    if (!hostId) { toast.error('Claim your listing first'); return; }
    setSaving(true);
    haptic.medium();
    const { error } = await supabase.from('hosts').update({
      capacity: capacity ? parseInt(capacity, 10) : null,
      languages, amenities, house_rules: rules,
    }).eq('id', hostId);
    setSaving(false);
    if (error) { toast.error('Could not save'); return; }
    toast.success('Preferences saved');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Preferences" showBack />
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }
  if (!hostId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Preferences" showBack />
        <View style={styles.empty}>
          <Ionicons name="home-outline" size={36} color={colors.amber} />
          <Text style={styles.emptyTitle}>Claim your listing first</Text>
          <Text style={styles.emptyBody}>Open MORE → Wanderhost → Become a Wanderhost.</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Preferences" showBack />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text style={styles.section}>Capacity</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={capacity}
          onChangeText={setCapacity}
          placeholder="How many beds?"
          placeholderTextColor={colors.ink3}
        />

        <Text style={styles.section}>Languages spoken</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map(l => (
            <Chip key={l} label={l} active={languages.includes(l)} onPress={() => toggle(languages, setLanguages, l)} />
          ))}
        </View>

        <Text style={styles.section}>Amenities offered</Text>
        <View style={styles.chipRow}>
          {AMENITIES.map(a => (
            <Chip key={a} label={a.replace(/_/g, ' ')} active={amenities.includes(a)} onPress={() => toggle(amenities, setAmenities, a)} />
          ))}
        </View>

        <Text style={styles.section}>House rules</Text>
        <View style={styles.chipRow}>
          {RULES.map(r => (
            <Chip key={r} label={r.replace(/_/g, ' ')} active={rules.includes(r)} onPress={() => toggle(rules, setRules, r)} />
          ))}
        </View>

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} onPress={save}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save preferences</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.amberBg, borderColor: colors.amber }]}
    >
      <Text style={[styles.chipText, active && { color: colors.amber, fontWeight: '700' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12 },
  emptyBody: { ...typography.body, color: colors.ink2, textAlign: 'center' },
  section: { ...typography.label, color: colors.ink2, marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
    color: colors.ink,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipText: { ...typography.bodySm, color: colors.ink2, textTransform: 'capitalize' },
  save: {
    marginTop: 28,
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
