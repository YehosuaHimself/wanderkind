import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, tierColors } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const TIERS = [
  { key: 'wanderkind', label: 'Wanderkind', nights: 0, desc: 'Every journey begins with a single step. Welcome to the path.' },
  { key: 'wunderkind', label: 'Wunderkind', nights: 5, desc: 'Your first nights on the road — curiosity is becoming commitment.' },
  { key: 'wandersmann', label: 'Wandersmann', nights: 15, desc: 'A true walker. You know the rhythm of the road.' },
  { key: 'ehrenmann', label: 'Ehrenmann', nights: 30, desc: 'Honored among walkers. Your presence uplifts every host.' },
  { key: 'pilger', label: 'Pilger', nights: 50, desc: 'A pilgrim at heart. The path has become part of who you are.' },
  { key: 'apostel', label: 'Apostel', nights: 80, desc: 'You carry the spirit of walking and share it with others.' },
  { key: 'lehrer', label: 'Lehrer', nights: 120, desc: 'A teacher of the way. Newcomers look to you for guidance.' },
  { key: 'meister', label: 'Meister', nights: 180, desc: 'A master of the wandering way. 180 nights of walking wisdom.' },
  { key: 'grossmeister', label: 'Grossmeister', nights: 250, desc: 'Grand master. Your journey is an inspiration to the community.' },
  { key: 'legende', label: 'Legende', nights: 365, desc: 'A living legend. A full year of nights spent on the walking path.' },
  { key: 'koenig', label: 'König', nights: 500, desc: 'The highest honor. A king of the road, a beacon for all Wanderkind.' },
];

export default function WanderkindWayScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { profile } = useAuth();
  const currentTier = profile?.tier ?? 'wanderkind';
  const nightsWalked = profile?.nights_walked ?? 0;

  const currentTierIndex = TIERS.findIndex(t => t.key === currentTier);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>THE WANDERKIND WAY</Text>
          <Text style={styles.headerTitle}>Your Journey</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressNights}>{nightsWalked}</Text>
          <Text style={styles.progressLabel}>NIGHTS WALKED</Text>
          {currentTierIndex < TIERS.length - 1 && (
            <Text style={styles.progressNext}>
              {TIERS[currentTierIndex + 1].nights - nightsWalked} more nights to {TIERS[currentTierIndex + 1].label}
            </Text>
          )}
        </View>

        {/* Tiers */}
        {TIERS.map((tier, idx) => {
          const isReached = idx <= currentTierIndex;
          const isCurrent = tier.key === currentTier;
          const color = tierColors[tier.key] ?? colors.ink3;

          return (
            <View
              key={tier.key}
              style={[
                styles.tierCard,
                isCurrent && styles.tierCardCurrent,
                isCurrent && { borderColor: color },
              ]}
            >
              <View style={styles.tierHeader}>
                <View style={[styles.tierDot, { backgroundColor: isReached ? color : colors.border }]} />
                <Text style={[styles.tierName, isReached && { color }]}>{tier.label}</Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.currentBadgeText, { color }]}>YOU ARE HERE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tierNights, !isReached && { color: colors.ink3 }]}>
                {tier.nights} nights
              </Text>
              <Text style={styles.tierDesc}>{tier.desc}</Text>
              {idx < TIERS.length - 1 && (
                <View style={[styles.tierConnector, isReached && { backgroundColor: color }]} />
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  scrollContent: { padding: spacing.lg },
  progressCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 24,
  },
  progressNights: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.amber,
  },
  progressLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.ink3,
    fontWeight: '600',
    marginTop: 4,
  },
  progressNext: {
    fontSize: 13,
    color: colors.ink2,
    marginTop: 12,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    position: 'relative',
  },
  tierCardCurrent: {
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  currentBadgeText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '700',
  },
  tierNights: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
    marginLeft: 18,
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 13,
    color: colors.ink3,
    lineHeight: 18,
    marginLeft: 18,
  },
  tierConnector: {
    position: 'absolute',
    bottom: -10,
    left: 23,
    width: 2,
    height: 10,
    backgroundColor: colors.border,
  },
});
