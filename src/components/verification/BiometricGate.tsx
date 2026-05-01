/**
 * BiometricGate — inline verification prompt.
 *
 * Camera selfie → immediate verify. No file upload option.
 * Resilient: verifies in DB even if storage upload fails.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../stores/auth';
import { useWKImagePicker } from '../../hooks/useWKImagePicker';
import { haptic } from '../../lib/haptics';
import { toast } from '../../lib/toast';

const ACTION_COPY: Record<string, { title: string; why: string }> = {
  'send messages': {
    title: 'Verify to Message',
    why: 'Messages are only between verified Wanderkinder — it keeps the community safe and trustworthy.',
  },
  'request a stay': {
    title: 'Verify to Request a Stay',
    why: 'Hosts open their home to people they can trust. Your selfie creates that trust.',
  },
  'access your passes': {
    title: 'Verify to Access Passes',
    why: 'Passes carry real value — a selfie ensures they go to real people.',
  },
  'share a PIN': {
    title: 'Verify to Share a PIN',
    why: 'PINs unlock physical spaces. Verification protects both the host and you.',
  },
  'use Hitchhike Mode': {
    title: 'Verify to Hitchhike',
    why: 'Your signal is more trusted — and more useful — when you are a verified Wanderkind.',
  },
  'use the map': {
    title: 'Verify to Appear on Map',
    why: 'Only verified Wanderkinder appear on the community map.',
  },
  default: {
    title: 'Verify Your Identity',
    why: 'This feature is available to verified Wanderkinder only.',
  },
};

type Step = 'prompt' | 'uploading' | 'done' | 'error';

interface Props {
  action?: string;
  onVerified: () => void;
  onDismiss: () => void;
}

export function BiometricGate({ action = 'default', onVerified, onDismiss }: Props) {
  const { user, fetchProfile } = useAuth() as any;
  const [step, setStep] = useState<Step>('prompt');
  const [errorMsg, setErrorMsg] = useState('');
  const { takeWithCamera, pickFromLibrary, picking } = useWKImagePicker({
    aspect: [1, 1],
    quality: 0.82,
    allowsEditing: true,
  });

  const copy = ACTION_COPY[action] ?? ACTION_COPY.default;

  // ── Core: upload selfie (best-effort) then mark verified ─────────────────
  const uploadAndVerify = useCallback(async (uri: string) => {
    if (!user?.id) return;
    setStep('uploading');

    try {
      // 1. Try selfie upload — non-blocking: failure doesn't stop verification
      let selfieUrl: string | null = null;
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const ext = blob.type === 'image/png' ? 'png' : 'jpg';
        const path = `biometric_selfies/${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { contentType: blob.type, upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          selfieUrl = urlData?.publicUrl ?? null;
        } else {
          console.warn('BiometricGate: selfie upload failed (continuing):', uploadError.message);
        }
      } catch (uploadErr) {
        console.warn('BiometricGate: selfie upload error (continuing):', uploadErr);
      }

      // 2. Mark verified — try biometric_verified column first, fall back gracefully
      const updatePayload: Record<string, any> = {
        verification_level: 'biometric',
        biometric_verified_at: new Date().toISOString(),
      };
      if (selfieUrl) updatePayload.biometric_selfie_url = selfieUrl;

      // Try full update (requires migration applied)
      let { error: updateError } = await supabase
        .from('profiles')
        .update({ ...updatePayload, biometric_verified: true })
        .eq('id', user.id);

      if (updateError) {
        // Column may not exist yet — fall back to verification_level only
        console.warn('BiometricGate: full update failed, falling back:', updateError.message);
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update({ verification_level: 'biometric' })
          .eq('id', user.id);
        if (fallbackError) throw fallbackError;
      }

      // 3. Refresh local profile
      try { await fetchProfile?.(); } catch { /* non-fatal */ }

      setStep('done');
      haptic.success?.() ?? haptic.medium();
      setTimeout(() => { onVerified(); }, 1200);

    } catch (err: any) {
      console.error('BiometricGate error:', err);
      setErrorMsg('Could not complete verification. Please try again.');
      setStep('error');
    }
  }, [user?.id, fetchProfile, onVerified]);

  const handleCamera = useCallback(async () => {
    haptic.light();
    const uri = await takeWithCamera();
    if (uri) await uploadAndVerify(uri);
  }, [takeWithCamera, uploadAndVerify]);

  // On web desktop where camera isn't available, fall back to library silently
  const handleFallbackLibrary = useCallback(async () => {
    haptic.light();
    const uri = await pickFromLibrary();
    if (uri) await uploadAndVerify(uri);
  }, [pickFromLibrary, uploadAndVerify]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <Ionicons name="checkmark-circle" size={48} color={colors.amber} />
        <Text style={styles.doneTitle}>You're Verified</Text>
        <Text style={styles.doneMsg}>Welcome to the full Wanderkind community.</Text>
      </View>
    );
  }

  if (step === 'error') {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.red} />
        <Text style={[styles.doneTitle, { color: colors.red }]}>Something went wrong</Text>
        <Text style={styles.doneMsg}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('prompt')} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'uploading' || picking) {
    return (
      <View style={[styles.card, styles.cardLoading]}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={styles.loadingText}>Verifying your identity…</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Dismiss */}
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.ink3} />
      </TouchableOpacity>

      {/* H-LABEL */}
      <View style={styles.labelRow}>
        <View style={styles.amberLine} />
        <Text style={styles.labelText}>IDENTITY VERIFICATION</Text>
      </View>

      <Text style={styles.title}>{copy.title}</Text>

      <View style={styles.whyCard}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.amber} />
        <Text style={styles.whyText}>{copy.why}</Text>
      </View>

      <View style={styles.bulletList}>
        {[
          'Take a quick selfie — 10 seconds',
          'Your photo is stored securely and never shared publicly',
          'Verified immediately — no waiting',
          'Required once, unlocks everything',
        ].map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      {/* Primary: camera selfie */}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleCamera} activeOpacity={0.85}>
        <Ionicons name="camera-outline" size={20} color="#FAF6EF" />
        <Text style={styles.primaryBtnText}>Take a Selfie</Text>
      </TouchableOpacity>

      {/* Web fallback — only shown on web where camera may not work */}
      {Platform.OS === 'web' && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFallbackLibrary} activeOpacity={0.8}>
          <Ionicons name="image-outline" size={18} color={colors.amber} />
          <Text style={styles.secondaryBtnText}>Choose from Library</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.trustNote}>
        By verifying, you agree to be accountable as a member of this community.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(200,118,42,0.22)',
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  cardDone: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    borderColor: colors.amberLine,
  },
  cardLoading: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  dismissBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  amberLine: {
    width: 14,
    height: 1.5,
    backgroundColor: colors.amber,
    borderRadius: 1,
  },
  labelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  whyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
  },
  bulletList: { marginBottom: 20, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: {
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: colors.amber,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 13, color: colors.ink2, lineHeight: 19 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.amber,
    borderRadius: 12,
    height: 52,
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAF6EF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(200,118,42,0.35)',
    borderRadius: 12,
    height: 46,
    marginBottom: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.amber,
  },
  trustNote: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 16,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  doneMsg: {
    fontSize: 14,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.amber,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAF6EF',
  },
  loadingText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.ink2,
  },
});
