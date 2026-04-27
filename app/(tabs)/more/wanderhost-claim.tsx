/**
 * Wanderhost Claim Flow — WK-120
 * Three steps on one scrollable screen so the walker never wonders how
 * far they have left to go. Submit creates a hosts row with category in
 * {free, donativo} and labels=['wanderhost'], then flips
 * profiles.is_hosting=true and lands on the hosting dashboard.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, isEmpty, enforceMaxLength } from '../../../src/lib/validate';

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;

export default function WanderhostClaim() {
  useAuthGuard();
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuth();

  const [category, setCategory] = useState<'free' | 'donativo' | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [openMonths, setOpenMonths] = useState<string[]>(MONTHS as unknown as string[]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingHostId, setExistingHostId] = useState<string | null>(null);

  // Pre-fill name from trail name
  useEffect(() => {
    if ((profile as any)?.trail_name && !name) {
      setName(`${(profile as any).trail_name}'s Wanderhost`);
    }
    // Pre-fill location from profile if set
    if ((profile as any)?.lat && (profile as any)?.lng && lat == null && lng == null) {
      setLat((profile as any).lat);
      setLng((profile as any).lng);
    }
  }, [profile]);

  // Detect already-claimed listing
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('hosts')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();
      if (data?.id) setExistingHostId(data.id);
    })();
  }, [user]);

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); resolve(); },
              () => resolve(),
              { timeout: 6000, maximumAge: 600000 },
            );
          });
        }
      } else {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLat(loc.coords.latitude); setLng(loc.coords.longitude);
        } else {
          toast.error('Location permission denied');
        }
      }
    } finally {
      setLocating(false);
    }
  };

  const toggleMonth = (m: string) => {
    setOpenMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const canSubmit = useMemo(() => {
    return !!user
      && !!category
      && !!name.trim()
      && lat != null && lng != null
      && Number(capacity) >= 1;
  }, [user, category, name, lat, lng, capacity]);

  const submit = async () => {
    if (!canSubmit || !user || !category) return;
    if (existingHostId) {
      router.replace('/(tabs)/me/hosting/dashboard' as any);
      return;
    }
    if (isEmpty(name)) { toast.error('Please give your place a name'); return; }
    const cleanName = enforceMaxLength(sanitizeText(name), 80) ? sanitizeText(name) : sanitizeText(name).slice(0, 80);
    const cleanDesc = description.trim() ? sanitizeText(description) : null;

    setSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from('hosts').insert({
        profile_id: user.id,
        name: cleanName,
        description: cleanDesc,
        lat,
        lng,
        host_type: category,
        category,
        labels: ['wanderhost'],
        capacity: Math.max(1, Number(capacity) || 1),
        opening_months: openMonths,
        amenities: [],
        gallery: [],
        is_available: true,
        hidden_from_map: false,
        verification_level: 'unverified',
        data_source: 'wanderhost_claim',
        source_id: `wh-${user.id}`,
      });
      if (insertErr) throw insertErr;

      // Update profile flag + home location if not set
      const profileUpdate: any = { is_hosting: true };
      if (!(profile as any)?.lat && lat != null) profileUpdate.lat = lat;
      if (!(profile as any)?.lng && lng != null) profileUpdate.lng = lng;
      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

      await fetchProfile?.();
      toast.success('Wanderhost listing created — welcome.');
      router.replace('/(tabs)/me/hosting/dashboard' as any);
    } catch (err: any) {
      console.error('claim failed', err);
      toast.error(err?.message ? `Failed: ${err.message}` : 'Could not create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const Step = ({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) => (
    <View style={styles.step}>
      <View style={styles.stepHead}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{n}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepSub}>{sub}</Text>
        </View>
      </View>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Become a Wanderhost" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {existingHostId ? (
            <View style={styles.existingBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={styles.existingText}>
                You already have a Wanderhost listing. Tap continue to manage it.
              </Text>
            </View>
          ) : (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>A Wanderkind who hosts.</Text>
              <Text style={styles.introBody}>
                Open your door — even just your floor — to other walkers. Wanderhosts
                default to <Text style={styles.bold}>free</Text> or <Text style={styles.bold}>donativo</Text>.
                We do not list paid stays here.
              </Text>
            </View>
          )}

          {/* Step 1 — choose category */}
          <Step
            n={1}
            title="Choose how you host"
            sub="The whole point of Wanderhost. Pick one."
          >
            <TouchableOpacity
              style={[
                styles.catCard,
                category === 'free' && { borderColor: '#5A7A2B', backgroundColor: '#E2EFD9' },
              ]}
              onPress={() => setCategory('free')}
              activeOpacity={0.85}
            >
              <Ionicons name="gift-outline" size={22} color={category === 'free' ? '#3F6112' : colors.ink2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.catTitle, category === 'free' && { color: '#3F6112' }]}>Free</Text>
                <Text style={styles.catBody}>No money. Hospitality as a gift.</Text>
              </View>
              {category === 'free' ? (
                <Ionicons name="checkmark-circle" size={22} color="#3F6112" />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.catCard,
                category === 'donativo' && { borderColor: '#C8762A', backgroundColor: '#FBEFD9' },
              ]}
              onPress={() => setCategory('donativo')}
              activeOpacity={0.85}
            >
              <Ionicons name="heart-outline" size={22} color={category === 'donativo' ? '#8C6010' : colors.ink2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.catTitle, category === 'donativo' && { color: '#8C6010' }]}>Donativo</Text>
                <Text style={styles.catBody}>Pay what you can. Keep the door open.</Text>
              </View>
              {category === 'donativo' ? (
                <Ionicons name="checkmark-circle" size={22} color="#8C6010" />
              ) : null}
            </TouchableOpacity>
          </Step>

          {/* Step 2 — basics */}
          <Step
            n={2}
            title="Tell walkers about your place"
            sub="A name, how many beds, optional notes."
          >
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="A short name for your place"
              placeholderTextColor={colors.ink3}
              maxLength={80}
            />

            <Text style={styles.fieldLabel}>How many can you host at once?</Text>
            <View style={styles.bedRow}>
              {[1, 2, 3, 4, 6, 10].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.bedChip, Number(capacity) === n && styles.bedChipActive]}
                  onPress={() => setCapacity(String(n))}
                >
                  <Text style={[styles.bedText, Number(capacity) === n && styles.bedTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="A floor, a couch, a garden — what walkers will find when they arrive."
              placeholderTextColor={colors.ink3}
              multiline
              maxLength={500}
            />
          </Step>

          {/* Step 3 — location + opening months */}
          <Step
            n={3}
            title="Where and when"
            sub="Pin your place on the map and tell us which months you welcome guests."
          >
            <Text style={styles.fieldLabel}>Location</Text>
            {lat != null && lng != null ? (
              <View style={styles.locationCard}>
                <Ionicons name="location" size={18} color={colors.amber} />
                <Text style={styles.locationText}>
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </Text>
                <TouchableOpacity onPress={useDeviceLocation} style={styles.locateBtn}>
                  <Text style={styles.locateBtnText}>Update</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locateBigBtn}
                onPress={useDeviceLocation}
                disabled={locating}
              >
                {locating ? (
                  <ActivityIndicator color={colors.amber} />
                ) : (
                  <>
                    <Ionicons name="locate" size={20} color={colors.amber} />
                    <Text style={styles.locateBigText}>Use my current location</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Open months</Text>
            <View style={styles.monthsRow}>
              {MONTHS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthChip, openMonths.includes(m) && styles.monthChipActive]}
                  onPress={() => toggleMonth(m)}
                >
                  <Text style={[styles.monthText, openMonths.includes(m) && styles.monthTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Step>

          {/* Submit */}
          <View style={styles.submitWrap}>
            <WKButton
              title={existingHostId ? 'Manage my listing' : (submitting ? 'Creating…' : 'Become a Wanderhost')}
              onPress={submit}
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={!canSubmit || submitting}
            />
            <Text style={styles.submitFootnote}>
              You can pause hosting anytime, or change category and details later.
              WANDERKIND = FREE TRAVEL.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },

  intro: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLt,
  },
  introTitle: { ...typography.h2, color: colors.ink, marginBottom: 6 },
  introBody: { ...typography.bodySm, color: colors.ink2, lineHeight: 20 },
  bold: { fontWeight: '700', color: colors.amber },

  existingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E2EFD9', borderRadius: radii.lg,
    padding: spacing.md, borderWidth: 1, borderColor: '#5A7A2B',
  },
  existingText: { flex: 1, fontSize: 13, color: '#3F6112', lineHeight: 18 },

  step: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.borderLt,
    overflow: 'hidden',
  },
  stepHead: {
    flexDirection: 'row', gap: 12, padding: spacing.lg,
    alignItems: 'center', backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1, borderBottomColor: colors.borderLt,
  },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepTitle: { ...typography.h3, color: colors.ink },
  stepSub: { ...typography.caption, color: colors.ink3, marginTop: 2 },
  stepBody: { padding: spacing.lg, gap: spacing.md },

  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: spacing.md, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink, fontSize: 16 },
  catBody: { ...typography.caption, color: colors.ink2, marginTop: 2 },

  fieldLabel: {
    ...typography.label, color: colors.ink3, marginTop: spacing.sm, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10, letterSpacing: 1.5, fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.ink,
    borderWidth: 1, borderColor: colors.borderLt,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },

  bedRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  bedChip: {
    width: 44, height: 38, borderRadius: 8, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLt,
  },
  bedChipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  bedText: { fontSize: 14, fontWeight: '600', color: colors.ink2 },
  bedTextActive: { color: '#fff' },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10,
    backgroundColor: colors.amberBg, borderWidth: 1, borderColor: colors.amberLine,
  },
  locationText: { flex: 1, fontSize: 13, color: colors.ink, fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New' },
  locateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.amber },
  locateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  locateBigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 10,
    backgroundColor: colors.amberBg, borderWidth: 1, borderColor: colors.amberLine,
  },
  locateBigText: { color: colors.amber, fontWeight: '700', fontSize: 14 },

  monthsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  monthChip: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderLt,
  },
  monthChipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  monthText: {
    fontSize: 10, fontWeight: '700', color: colors.ink2, letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
  },
  monthTextActive: { color: '#fff' },

  submitWrap: { gap: 8, marginTop: 4 },
  submitFootnote: {
    ...typography.caption, color: colors.ink3, textAlign: 'center', lineHeight: 16,
  },
});
