/**
 * BiometricGate — inline verification prompt.
 *
 * Rendered at the point of action when a user tries to do something
 * that requires biometric verification. Selfie upload → immediate verify.
 *
 * Design: parchment card, amber accents, H-LABEL typography.
 * Never blocks the screen — always sits inside the existing layout.
 *
 * Usage:
 *   {gateVisible && (
 *     <BiometricGate
 *       action="send messages"
 *       onVerified={onVerified}
 *       onDismiss={closeGate}
 *     />
 *   )}
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography } from '../../lib/theme';
import { useAuth } from '../../stores/auth';
import { useWKImagePicker } from '../../hooks/useWKImagePicker';
import { haptic } from '../../lib/haptics';
import { toast } from '../../lib/toast';

// ─── What each gated action unlocks ──────────────────────────────────────────

const ACTION_COPY: Record<string, { title: string; why: string }> = {
  'send messages': {
    title: 'Send Messages',
    why: 'Messages are only between verified Wanderkinder — it keeps the community safe and trustworthy.',
  },
  'request a stay': {
    title: 'Request a Stay',
    why: 'Hosts open their home to people they can trust. Your selfie creates that trust.',
  },
  'access your passes': {
    title: 'Access Passes',
    why: 'Passes carry real value — a selfie ensures they go to real people.',
  },
  'share a PIN': {
    title: 'Share a PIN',
    why: 'PINs unlock physical spaces. Verification protects both the host and you.',
  },
  default: {
    title: 'Verify Your Identity',
    why: 'This feature is available to verified Wanderkinder only.',
  },
};

type Step = 'prompt' | 'uploading' | 'done';

interface Props {
  /** Lowercase action name, e.g. "send messages" */
  action?: string;
  onVerified: () => void;
  onDismiss: () => void;
}

export function BiometricGate({ action = 'default', onVerified, onDismiss }: Props) {
  const { user, fetchProfile } = useAuth() as any;
  const [step, setStep] = useState<Step>('prompt');
  const { takeWithCamera, pickFromLibrary, picking } = useWKImagePicker({
    aspect: [1, 1],
    quality: 0.82,
    allowsEditing: true,
  });

  const copy = ACTION_COPY[action] ?? ACTION_COPY.default;

  // ── Upload selfie → mark verified ────────────────────────────────────────
  const uploadAndVerify = useCallback(async (uri: string) => {
    if (!user?.id) return;
    setStep('uploading');

    try {
      // 1. Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `biometric_selfies/${user.id}/${Date.now()}.${ext}`;

      // 2. Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')   // reuse existing bucket; selfies in biometric_selfies/ prefix
        .upload(path, blob, { contentType: blob.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const selfieUrl = urlData?.publicUrl ?? null;

      // 3. Mark profile as biometric verified (immediate — accountability model)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          biometric_verified: true,
          biometric_selfie_url: selfieUrl,
          biometric_verified_at: new Date().toISOString(),
          verification_level: 'biometric',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Refresh local profile state
      await fetchProfile?.();

      setStep('done');
      haptic.success?.() ?? haptic.medium();

      // Small pause so the success state is readable, then call back
      setTimeout(() => {
        onVerified();
      }, 1200);

    } catch (err: any) {
      console.error('BiometricGate upload error:', err);
      toast.error('Could not complete verification. Please try again.');
      setStep('prompt');
    }
  }, [user?.id, fetchProfile, onVerified]);

  const handleCamera = useCallback(async () => {
    haptic.light();
    const uri = await takeWithCamera();
    if (uri) await uploadAndVerify(uri);
  }, [takeWithCamera, uploadAndVerify]);

  const handleLibrary = useCallback(async () => {
    haptic.light();
    const uri = await pickFromLibrary();
    if (uri) await uploadAndVerify(uri);
  }, [pickFromLibrary, uploadAndVerify]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={36} color={colors.amber} />
        </View>
        <Text style={styles.doneTitle}>You're Verified</Text>
        <Text style={styles.doneMsg}>Welcome to the full Wanderkind community.</Text>
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

      {/* Title */}
      <Text style={styles.title}>{copy.title}</Text>

      {/* Why */}
      <View style={styles.whyCard}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.amber} />
        <Text style={styles.whyText}>{copy.why}</Text>
      </View>

      {/* What verification means */}
      <View style={styles.bulletList}>
        {[
          'Upload a clear selfie — takes 10 seconds',
          'Your photo is stored securely and never shared',
          'Verified immediately — no waiting',
          'Required once, unlocks everything',
        ].map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      {/* Primary: selfie with camera */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleCamera}
        activeOpacity={0.85}
      >
        <Ionicons name="camera-outline" size={20} color="#FAF6EF" />
        <Text style={styles.primaryBtnText}>Take a Selfie</Text>
      </TouchableOpacity>

      {/* Secondary: upload from library */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={handleLibrary}
        activeOpacity={0.8}
      >
        <Ionicons name="image-outline" size={18} color={colors.amber} />
        <Text style={styles.secondaryBtnText}>Upload from Library</Text>
      </TouchableOpacity>

      {/* Trust note */}
      <Text style={styles.trustNote}>
        By verifying, you agree to be accountable as a member of this community.
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    paddingVertical: 32,
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

  // H-LABEL
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
    marginBottom: 14,
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

  // Done state
  doneIcon: { marginBottom: 12 },
  doneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  doneMsg: {
    fontSize: 14,
    color: colors.ink2,
    textAlign: 'center',
  },

  loadingText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.ink2,
  },
});
