/**
 * WK-122 — notification preferences. Toggles persist to profiles.notif_prefs jsonb.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';

type Prefs = {
  new_request: boolean;
  new_message: boolean;
  arrival_today: boolean;
  weekly_digest: boolean;
  quiet_hours: boolean;
};

const DEFAULTS: Prefs = {
  new_request: true,
  new_message: true,
  arrival_today: true,
  weekly_digest: false,
  quiet_hours: true,
};

const ROWS: Array<{ key: keyof Prefs; icon: any; title: string; sub: string }> = [
  { key: 'new_request',   icon: 'mail-unread-outline',     title: 'New booking requests',  sub: 'Walker asks to stay tonight' },
  { key: 'new_message',   icon: 'chatbubble-ellipses-outline', title: 'New messages',       sub: 'Direct message from a walker' },
  { key: 'arrival_today', icon: 'walk-outline',            title: 'Arrival today',         sub: 'Reminder before your guest arrives' },
  { key: 'weekly_digest', icon: 'newspaper-outline',       title: 'Weekly digest',         sub: 'Sunday summary of activity' },
  { key: 'quiet_hours',   icon: 'moon-outline',            title: 'Quiet hours 22:00–07:00', sub: 'Hold non-urgent pings overnight' },
];

export default function NotificationsScreen() {
  const { user } = useAuthGuard();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('notif_prefs').eq('id', user.id).maybeSingle();
    if (data?.notif_prefs && typeof data.notif_prefs === 'object') {
      setPrefs({ ...DEFAULTS, ...(data.notif_prefs as any) });
    }
    setLoading(false);
  })(); }, [user]);

  const toggle = (k: keyof Prefs) => {
    haptic.selection();
    setPrefs(p => ({ ...p, [k]: !p[k] }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    haptic.medium();
    const { error } = await supabase.from('profiles').update({ notif_prefs: prefs as any }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Could not save'); return; }
    toast.success('Notifications saved');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Notifications" showBack />
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Notifications" showBack />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text style={styles.lead}>Choose how often Wanderkind taps your shoulder.</Text>
        {ROWS.map(r => (
          <View key={r.key} style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name={r.icon} size={18} color={colors.amber} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowSub}>{r.sub}</Text>
            </View>
            <Switch
              value={prefs[r.key]}
              onValueChange={() => toggle(r.key)}
              trackColor={{ false: colors.border, true: colors.amberBg }}
              thumbColor={prefs[r.key] ? colors.amber : colors.ink3}
            />
          </View>
        ))}
        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} onPress={save}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lead: { ...typography.body, color: colors.ink2, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.amberBg,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { ...typography.body, color: colors.ink, fontWeight: '600' },
  rowSub: { ...typography.caption, color: colors.ink3, marginTop: 2 },
  save: {
    marginTop: 24,
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
