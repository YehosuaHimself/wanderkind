import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, TextInput, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function StampCeremony() {
  const _AnimView = Animated.View as any;
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const router = useRouter();
  const { hostName, stampId } = useLocalSearchParams();
  const [stampScale] = useState(new Animated.Value(0));
  const [stampOpacity] = useState(new Animated.Value(0));
  const [particleOpacity] = useState(new Animated.Value(0));
  const [showContinue, setShowContinue] = useState(false);
  const [reflection, setReflection] = useState('');
  const [reflectionPublic, setReflectionPublic] = useState(true); // default: share with hosts
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Sequence: fade in, scale stamp, animate particles
    Animated.sequence([
      Animated.timing(stampOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(stampScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setShowContinue(true), 800);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stamp Ceremony</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.ceremonialText}>Your stamp from</Text>
        <Text style={styles.hostName}>{(hostName as string) || 'Your Host'}</Text>

        {/* Animated Stamp */}
        <View style={styles.stampContainer}>
          <_AnimView
            style={[
              styles.stamp,
              {
                transform: [{ scale: stampScale }],
                opacity: stampOpacity,
              },
            ]}
          >
            <View style={styles.stampCircle}>
              <Ionicons name="ribbon" size={64} color={colors.surface} />
            </View>
          </_AnimView>

          {/* Animated Particles */}
          <_AnimView
            style={[
              styles.particles,
              { opacity: particleOpacity },
            ]}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    transform: [
                      { rotate: `${(360 / 8) * i}deg` },
                      { translateY: -80 },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={20} color={colors.gold} />
              </View>
            ))}
          </_AnimView>
        </View>

        <Text style={styles.celebrationText}>
          You've earned a{'\n'}stamp of accomplishment
        </Text>

        {/* Blessing Text */}
        <View style={styles.blessingBox}>
          <Text style={styles.blessingText}>
            "May your journey be blessed{'\n'}with hospitality and wonder."
          </Text>
        </View>

        {/* Reflection Field — optional, appears after animation */}
        {showContinue && (
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionLabel}>REFLECTION</Text>
            <TextInput
              style={styles.reflectionInput}
              placeholder="What will you remember from this stay?"
              placeholderTextColor={colors.ink3}
              value={reflection}
              onChangeText={setReflection}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            {/* Share with hosts toggle */}
            <View style={styles.shareToggleRow}>
              <View style={styles.shareToggleLeft}>
                <Ionicons
                  name={reflectionPublic ? 'eye-outline' : 'lock-closed-outline'}
                  size={14}
                  color={reflectionPublic ? colors.green : colors.ink3}
                />
                <Text style={[styles.reflectionHint, reflectionPublic && { color: colors.green, fontStyle: 'normal' }]}>
                  {reflectionPublic ? 'Visible to hosts' : 'Only you can see this'}
                </Text>
              </View>
              <Switch
                value={reflectionPublic}
                onValueChange={setReflectionPublic}
                trackColor={{ false: colors.borderLt, true: `${colors.green}66` }}
                thumbColor={reflectionPublic ? colors.green : colors.ink3}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
        )}
      </View>

      {showContinue && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.footer}
        >
          <TouchableOpacity
            style={[styles.continueBtn, saving && { opacity: 0.6 }]}
            disabled={saving}
            onPress={async () => {
              if (reflection.trim() && stampId) {
                setSaving(true);
                await supabase
                  .from('stamps')
                  .update({
                    reflection: reflection.trim(),
                    reflection_public: reflectionPublic,
                  })
                  .eq('id', stampId as string);
                setSaving(false);
              }
              router.back();
            }}
          >
            <Text style={styles.continueBtnText}>
              {saving ? 'Saving...' : 'View Your Stamps'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  ceremonialText: { ...typography.bodySm, color: colors.ink3, marginBottom: 4 },
  hostName: { ...typography.h1, color: colors.amber, marginBottom: spacing.xl, textAlign: 'center' },
  stampContainer: { position: 'relative', width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl },
  stamp: { width: 160, height: 160 },
  stampCircle: {
    flex: 1,
    borderRadius: 80,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particles: { position: 'absolute', width: 200, height: 200 },
  particle: {
    position: 'absolute',
    left: 100,
    top: 100,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationText: { ...typography.h2, color: colors.ink, textAlign: 'center', marginTop: spacing.xl, lineHeight: 35 },
  blessingBox: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.parchment,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
  },
  blessingText: { ...typography.bodySm, color: colors.ink, textAlign: 'center', lineHeight: 20 },
  reflectionBox: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    padding: spacing.md,
  },
  reflectionLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
    marginBottom: 8,
  },
  reflectionInput: {
    ...typography.body,
    color: colors.ink,
    minHeight: 60,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  reflectionHint: {
    ...typography.caption,
    color: colors.ink3,
  },
  shareToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  shareToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  continueBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
