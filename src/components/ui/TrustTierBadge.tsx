/**
 * TrustTierBadge — derives a 4-tier badge from the host's quality_score.
 *   80+ → Verified Gold
 *   60+ → Trusted Silver
 *   40+ → Listed Bronze
 *   <40 → Unverified
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';

export type TrustTier = 'gold' | 'silver' | 'bronze' | 'unverified';

export function tierFor(quality_score?: number | null): TrustTier {
  const q = quality_score ?? 0;
  if (q >= 80) return 'gold';
  if (q >= 60) return 'silver';
  if (q >= 40) return 'bronze';
  return 'unverified';
}

const TIER_META: Record<TrustTier, { label: string; bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  gold:       { label: 'VERIFIED GOLD', bg: '#F4E5C8',          fg: '#8C6010', icon: 'shield-checkmark' },
  silver:     { label: 'TRUSTED',       bg: '#E2E8EC',          fg: '#3F4E5A', icon: 'shield-half' },
  bronze:     { label: 'LISTED',        bg: '#EBDDCB',          fg: '#7A4F1E', icon: 'shield-outline' },
  unverified: { label: 'UNVERIFIED',    bg: colors.surfaceAlt,  fg: colors.ink3, icon: 'help-circle-outline' },
};

export function TrustTierBadge({
  quality_score,
  showScore = false,
}: {
  quality_score?: number | null;
  showScore?: boolean;
}) {
  const tier = tierFor(quality_score);
  const m = TIER_META[tier];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Ionicons name={m.icon} size={11} color={m.fg} />
      <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
      {showScore && quality_score !== null && quality_score !== undefined ? (
        <Text style={[styles.score, { color: m.fg }]}>· {quality_score}/100</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  text: { ...typography.monoXs, fontWeight: '700', letterSpacing: 1.2, fontSize: 9 },
  score: { ...typography.monoXs, fontWeight: '600', fontSize: 9, opacity: 0.8 },
});
