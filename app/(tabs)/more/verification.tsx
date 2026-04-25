import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const VERIFICATION_STEPS = [
  {
    id: 'email',
    icon: 'mail-outline' as const,
    title: 'Email Verified',
    desc: 'Confirm your email address',
    color: '#22C55E',
  },
  {
    id: 'phone',
    icon: 'call-outline' as const,
    title: 'Phone Number',
    desc: 'Add and verify your phone number',
    color: '#3B82F6',
  },
  {
    id: 'id',
    icon: 'card-outline' as const,
    title: 'ID Verification',
    desc: 'Upload a government-issued ID',
    color: '#D97706',
  },
  {
    id: 'references',
    icon: 'people-outline' as const,
    title: 'References',
    desc: 'Get verified by other Wanderkinder',
    color: '#7C3AED',
  },
];

export default function VerificationScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { profile } = useAuth();
  const verLevel = profile?.verification_level ?? 'basic';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>TRUST & SAFETY</Text>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={28} color={colors.gold} />
          <Text style={styles.infoTitle}>Build Trust on the Road</Text>
          <Text style={styles.infoText}>
            Verification helps hosts and walkers feel safe. Complete steps below to increase your trust level.
          </Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{verLevel.toUpperCase()}</Text>
          </View>
        </View>

        {VERIFICATION_STEPS.map((step) => (
          <TouchableOpacity key={step.id} style={styles.stepCard} activeOpacity={0.7}>
            <View style={[styles.stepIcon, { backgroundColor: `${step.color}15` }]}>
              <Ionicons name={step.icon} size={22} color={step.color} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </TouchableOpacity>
        ))}

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
  headerTitle: { ...typography.h3, color: colors.ink },
  scrollContent: { padding: spacing.lg },
  infoCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  levelBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.amberBg,
  },
  levelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '700',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  stepDesc: { fontSize: 12, color: colors.ink3 },
});
