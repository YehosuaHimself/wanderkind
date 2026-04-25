import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const VERIFICATION_STEPS = [
  {
    level: 'Self-Verified',
    description: 'You created your profile',
    icon: 'person-circle',
    color: colors.verSelf,
    completed: true,
    steps: ['Create account', 'Add profile info'],
  },
  {
    level: 'Community Verified',
    description: 'Vouched by fellow wanderers',
    icon: 'people',
    color: colors.verCommunity,
    completed: false,
    steps: ['Host or stay with others', 'Receive positive reviews', 'Get community stamp'],
  },
  {
    level: 'Association Verified',
    description: 'Verified by pilgrim association',
    icon: 'shield-checkmark',
    color: colors.verAssociation,
    completed: false,
    steps: ['Apply to association', 'Submit documents', 'Review & approval'],
  },
  {
    level: 'Wanderkind Verified',
    description: 'Official Wanderkind credential',
    icon: 'medal',
    color: colors.verWanderkind,
    completed: false,
    steps: ['Reach König tier', 'Host at least 50 nights', 'Wanderkind approval'],
  },
];

export default function VerificationScreen() {
  useAuthGuard();

  const { profile } = useAuth();
  const currentLevel = profile?.verification_level || 'self';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Verification" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Build trust through verification tiers
        </Text>

        {VERIFICATION_STEPS.map((step, idx) => {
          const isActive = VERIFICATION_STEPS.findIndex(
            s => s.level.toLowerCase().replace(' ', '') === currentLevel.replace(' ', '')
          ) >= idx;
          const isCurrent = VERIFICATION_STEPS.findIndex(
            s => s.level.toLowerCase().replace(' ', '') === currentLevel.replace(' ', '')
          ) === idx;

          return (
            <WKCard
              key={step.level}
              variant={isCurrent ? 'parchment' : 'default'}
              style={[styles.verCard, !isActive && styles.verCardInactive]}
            >
              {/* Header */}
              <View style={styles.verHeader}>
                <View style={[styles.verIcon, { backgroundColor: `${step.color}15` }]}>
                  <Ionicons name={step.icon as any} size={24} color={step.color} />
                </View>

                <View style={styles.verTitleSection}>
                  <Text style={[styles.verTitle, isActive && { color: step.color }]}>
                    {step.level.toUpperCase()}
                  </Text>
                  <Text style={styles.verDesc}>{step.description}</Text>
                </View>

                {isActive && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color={step.color} />
                  </View>
                )}
              </View>

              {/* Steps */}
              <View style={styles.stepsSection}>
                {step.steps.map((stepText, stepIdx) => (
                  <View key={stepIdx} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepNumber,
                        isActive && { backgroundColor: step.color, color: '#fff' },
                      ]}
                    >
                      <Text style={styles.stepNumberText}>{stepIdx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{stepText}</Text>
                  </View>
                ))}
              </View>

              {isCurrent && (
                <WKButton
                  title="Learn More"
                  onPress={() => {}}
                  variant="outline"
                  size="sm"
                  style={styles.learnButton}
                />
              )}
            </WKCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  verCard: {
    marginBottom: spacing.md,
  },
  verCardInactive: {
    opacity: 0.6,
  },
  verHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  verIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verTitleSection: {
    flex: 1,
  },
  verTitle: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
    letterSpacing: 1,
  },
  verDesc: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.greenBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsSection: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.ink3,
    fontWeight: '600',
  },
  stepText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
  },
  learnButton: {
    marginTop: spacing.lg,
  },
});
