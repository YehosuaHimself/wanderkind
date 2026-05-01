/**
 * WK-124 — access secrets. Persists to host_access_secrets with strict RLS:
 * the host owns the row; walkers only SELECT it after a confirmed booking.
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

export default function PinGateCodeScreen() {
  const { user } = useAuthGuard();
  const [hostId, setHostId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [gate, setGate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => { (async () => {
    if (!user) return;
    const { data: host } = await supabase.from('hosts').select('id').eq('profile_id', user.id).limit(1).maybeSingle();
    if (host) {
      setHostId(host.id);
      const { data: secret } = await supabase.from('host_access_secrets').select('*').eq('host_id', host.id).maybeSingle();
      if (secret) {
        setPin(secret.pin || '');
        setGate(secret.gate_code || '');
        setNotes(secret.notes || '');
      }
    }
    setLoading(false);
  })(); }, [user]);

  const save = async () => {
    if (!hostId || !user) { toast.error('Claim your listing first'); return; }
    setSaving(true);
    haptic.medium();
    const { error } = await supabase.from('host_access_secrets').upsert({
      host_id: hostId,
      profile_id: user.id,
      pin: pin.trim() || null,
      gate_code: gate.trim() || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'host_id' });
    setSaving(false);
    if (error) { toast.error('Could not save'); return; }
    toast.success('Access details saved');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Pin & Gate Code" showBack />
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }
  if (!hostId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Pin & Gate Code" showBack />
        <View style={styles.empty}>
          <Ionicons name="key-outline" size={36} color={colors.amber} />
          <Text style={styles.emptyTitle}>Claim your listing first</Text>
          <Text style={styles.emptyBody}>Open MORE → Your Offering → Set Up Your Offering.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mask middle of a stored secret unless the user taps Reveal.
  const mask = (s: string) => s.length <= 2 ? s : (s[0] + '••••' + s[s.length - 1]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Pin & Gate Code" showBack />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <View style={styles.banner}>
          <Ionicons name="lock-closed" size={16} color={colors.amber} />
          <Text style={styles.bannerText}>
            Stored encrypted. Revealed only to walkers with a confirmed booking, while their stay window is open.
          </Text>
        </View>

        <Text style={styles.label}>Door PIN</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={reveal ? pin : (pin ? mask(pin) : '')}
            onChangeText={setPin}
            secureTextEntry={!reveal}
            placeholder="e.g. 4-2-7-1"
            placeholderTextColor={colors.ink3}
            keyboardType="default"
          />
          <TouchableOpacity style={styles.eye} onPress={() => { haptic.selection(); setReveal(r => !r); }}>
            <Ionicons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.ink2} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Gate code</Text>
        <TextInput
          style={styles.input}
          value={reveal ? gate : (gate ? mask(gate) : '')}
          onChangeText={setGate}
          secureTextEntry={!reveal}
          placeholder="e.g. *1234#"
          placeholderTextColor={colors.ink3}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder='e.g. "Key under the third stone left of the door."'
          placeholderTextColor={colors.ink3}
          multiline
        />

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} onPress={save}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save access details</Text>}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 20,
  },
  bannerText: { ...typography.bodySm, color: colors.ink2, flex: 1 },
  label: { ...typography.label, color: colors.ink2, marginTop: 14, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
    color: colors.ink,
  },
  eye: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  save: {
    marginTop: 24,
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
