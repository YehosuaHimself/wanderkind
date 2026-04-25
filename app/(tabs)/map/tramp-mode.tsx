import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function TrampMode() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [trampModeEnabled, setTrampModeEnabled] = useState(false);
  const [showingProfile, setShowingProfile] = useState(false);

  const tips = [
    {
      title: 'Stay Visible',
      description: 'Stand in a visible location with good sight lines. Make eye contact and smile.',
      icon: 'eye' as const,
    },
    {
      title: 'Safety First',
      description: 'Trust your instinct. If something feels off, wait for the next ride.',
      icon: 'shield-checkmark' as const,
    },
    {
      title: 'Travel Light',
      description: 'Keep your main pack with you. Hitchhikers often have limited space.',
      icon: 'backpack' as const,
    },
    {
      title: 'Be Friendly',
      description: 'Chat with drivers. They\'re more likely to stop if you seem personable.',
      icon: 'happy' as const,
    },
    {
      title: 'Have Cash',
      description: 'Offer to contribute to fuel. Many drivers appreciate the gesture.',
      icon: 'cash' as const,
    },
    {
      title: 'Plan Ahead',
      description: 'Know your route and have backup plans for longer stretches.',
      icon: 'map' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Tramp Mode" showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Toggle Card */}
          <WKCard variant="gold">
            <View style={styles.toggleHeader}>
              <View style={styles.toggleLeft}>
                <View style={styles.trampIcon}>
                  <Ionicons name="car" size={28} color={colors.tramp} />
                </View>
                <View>
                  <Text style={styles.toggleTitle}>Tramp Mode</Text>
                  <Text style={styles.toggleSubtitle}>
                    {trampModeEnabled ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <Switch
                value={trampModeEnabled}
                onValueChange={setTrampModeEnabled}
                thumbColor={trampModeEnabled ? colors.tramp : colors.ink3}
                trackColor={{ false: colors.borderLt, true: `${colors.tramp}40` }}
              />
            </View>

            {trampModeEnabled && (
              <View style={styles.activeIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.activeText}>You're visible to drivers on the map</Text>
              </View>
            )}
          </WKCard>

          {/* How It Works */}
          <WKCard>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howItWorks}>
              <HowItWorksStep number="1" title="Enable Tramp Mode" description="Turn on your hitchhiking status above" />
              <HowItWorksStep number="2" title="Share Your Location" description="Drivers nearby will see you on their map" />
              <HowItWorksStep number="3" title="Connect with Drivers" description="Accept ride requests from fellow wanderers" />
            </View>
          </WKCard>

          {/* Tips */}
          <View>
            <Text style={styles.sectionTitle} style={[styles.sectionTitle, { marginLeft: spacing.lg }]}>
              Hitchhiking Tips
            </Text>
            <View style={styles.tipsList}>
              {tips.map((tip, i) => (
                <WKCard key={i} style={styles.tipCard}>
                  <View style={styles.tipHeader}>
                    <View style={styles.tipIcon}>
                      <Ionicons name={tip.icon} size={18} color={colors.tramp} />
                    </View>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                  </View>
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                </WKCard>
              ))}
            </View>
          </View>

          {/* Safety Guidelines */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Safety Guidelines</Text>
            <View style={styles.safetyList}>
              <SafetyItem text="Share your location with a trusted friend" />
              <SafetyItem text="Trust your gut feeling about drivers" />
              <SafetyItem text="Avoid accepting rides at night" />
              <SafetyItem text="Keep valuables with you, not in luggage" />
              <SafetyItem text="Let someone know your expected arrival" />
            </View>
          </WKCard>

          {/* Nearby Drivers (when enabled) */}
          {trampModeEnabled && (
            <WKCard>
              <Text style={styles.sectionTitle}>Nearby Drivers</Text>
              <Text style={styles.noDriversText}>No drivers nearby right now</Text>
            </WKCard>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <WKButton
              title={trampModeEnabled ? 'Turn Off Tramp Mode' : 'Enable Tramp Mode'}
              onPress={() => setTrampModeEnabled(!trampModeEnabled)}
              variant={trampModeEnabled ? 'danger' : 'primary'}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function SafetyItem({ text }: { text: string }) {
  return (
    <View style={styles.safetyItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.green} />
      <Text style={styles.safetyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trampIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.tramp}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  toggleSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  activeText: {
    ...typography.bodySm,
    color: colors.green,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  howItWorks: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.h3,
    color: colors.amber,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  tipsList: {
    gap: spacing.md,
    marginLeft: spacing.lg,
  },
  tipCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: `${colors.tramp}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  tipDescription: {
    ...typography.bodySm,
    color: colors.ink2,
    marginLeft: 44,
  },
  safetyList: {
    gap: spacing.md,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  safetyText: {
    ...typography.bodySm,
    color: colors.parchmentInk,
    flex: 1,
    paddingTop: 2,
  },
  noDriversText: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  buttonGroup: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
});
