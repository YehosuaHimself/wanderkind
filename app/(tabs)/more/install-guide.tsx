import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type Platform = 'ios' | 'android';

export default function InstallGuideScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('ios');

  const iosSteps = [
    {
      number: '1',
      title: 'Open Safari',
      description: 'Launch Safari and navigate to the Wanderkind app or visit wanderkind.love',
    },
    {
      number: '2',
      title: 'Tap Share',
      description: 'Tap the Share icon (arrow pointing up) at the bottom of the screen',
    },
    {
      number: '3',
      title: 'Select Add to Home Screen',
      description: 'Scroll down and select "Add to Home Screen" from the menu',
    },
    {
      number: '4',
      title: 'Confirm',
      description: 'Edit the app name if desired, then tap "Add" in the top right',
    },
    {
      number: '5',
      title: 'Launch',
      description: 'The Wanderkind icon now appears on your home screen. Tap to open!',
    },
  ];

  const androidSteps = [
    {
      number: '1',
      title: 'Open Chrome',
      description: 'Launch Chrome and navigate to the Wanderkind app or visit wanderkind.love',
    },
    {
      number: '2',
      title: 'Tap Menu',
      description: 'Tap the three dots menu icon in the top right corner',
    },
    {
      number: '3',
      title: 'Select Install App',
      description: 'Tap "Install app" or "Add to Home Screen" from the dropdown menu',
    },
    {
      number: '4',
      title: 'Confirm',
      description: 'A dialog will appear. Tap "Install" to confirm',
    },
    {
      number: '5',
      title: 'Launch',
      description: 'The Wanderkind icon now appears on your home screen. Tap to open!',
    },
  ];

  const steps = selectedPlatform === 'ios' ? iosSteps : androidSteps;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Add to Home Screen" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard variant="parchment" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2, lineHeight: 22 }]}>
            Install Wanderkind as a web app on your home screen for quick access and offline capability.
          </Text>
        </WKCard>

        {/* Platform Selection */}
        <View style={styles.platformToggle}>
          <TouchableOpacity
            style={[
              styles.platformButton,
              selectedPlatform === 'ios' && styles.platformButtonActive,
            ]}
            onPress={() => setSelectedPlatform('ios')}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-apple" size={16} color={selectedPlatform === 'ios' ? colors.surface : colors.ink3} />
            <Text
              style={[
                styles.platformLabel,
                selectedPlatform === 'ios' && styles.platformLabelActive,
              ]}
            >
              iPhone/iPad
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.platformButton,
              selectedPlatform === 'android' && styles.platformButtonActive,
            ]}
            onPress={() => setSelectedPlatform('android')}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-android" size={16} color={selectedPlatform === 'android' ? colors.surface : colors.ink3} />
            <Text
              style={[
                styles.platformLabel,
                selectedPlatform === 'android' && styles.platformLabelActive,
              ]}
            >
              Android
            </Text>
          </TouchableOpacity>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepWrapper}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits Card */}
        <WKCard variant="gold" style={{ marginTop: spacing.xl }}>
          <Text style={[typography.h3, { color: colors.amber, marginBottom: spacing.md }]}>
            Benefits
          </Text>
          {[
            'Quick access from your home screen',
            'Works offline for essential features',
            'No storage limitations like native apps',
            'Easy to uninstall (like any app)',
          ].map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.amber} />
              <Text style={[typography.bodySm, { color: colors.ink2, flex: 1, marginLeft: spacing.md }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  platformToggle: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  platformButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.sm,
  },
  platformButtonActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  platformLabel: { ...typography.body, color: colors.ink3, fontWeight: '600' },
  platformLabelActive: { color: colors.surface },
  stepsContainer: { gap: spacing.lg, marginBottom: spacing.xl },
  stepWrapper: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  stepContent: { flex: 1, justifyContent: 'center' },
  stepTitle: { ...typography.body, color: colors.ink, fontWeight: '600', marginBottom: spacing.sm },
  stepDescription: { ...typography.bodySm, color: colors.ink3 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
