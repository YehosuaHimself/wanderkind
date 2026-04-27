import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKInput } from '../../../../src/components/ui/WKInput';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const RULES = [
  { id: 'shoes', label: 'Shoes off indoors', icon: 'footsteps-outline' as const },
  { id: 'quiet', label: 'Quiet hours (10pm-7am)', icon: 'moon' as const },
  { id: 'smoking', label: 'No smoking', icon: 'close-circle' as const },
  { id: 'pets', label: 'Pets allowed', icon: 'paw' as const },
  { id: 'alcohol', label: 'Alcohol free', icon: 'wine' as const },
];

export default function HouseRulesScreen() {
  const { user, isLoading } = useAuthGuard();
  const [maxStayDays, setMaxStayDays] = useState('30');
  const [rules, setRules] = useState<Record<string, boolean>>({
    shoes: true,
    quiet: true,
    smoking: true,
    pets: false,
    alcohol: false,
  });


  const toggleRule = (id: string) => {
    setRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="House Rules" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Rules Info */}
          <WKCard variant="parchment">
            <View style={styles.infoHeader}>
              <Ionicons name="home" size={20} color={colors.ink2} />
              <Text style={styles.infoTitle}>Your House Rules</Text>
            </View>
            <Text style={styles.infoText}>
              Clear house rules create better guest experiences and set expectations.
            </Text>
          </WKCard>

          {/* Rules List */}
          <WKCard>
            {RULES.map((rule, idx) => (
              <View
                key={rule.id}
                style={[
                  styles.ruleRow,
                  idx < RULES.length - 1 && styles.ruleRowBorder,
                ]}
              >
                <View style={styles.ruleLeft}>
                  <View style={styles.ruleIcon}>
                    <Ionicons name={rule.icon} size={20} color={colors.amber} />
                  </View>
                  <Text style={styles.ruleLabel}>{rule.label}</Text>
                </View>
                <Switch
                  value={rules[rule.id] || false}
                  onValueChange={() => toggleRule(rule.id)}
                  trackColor={{ false: colors.border, true: colors.amberBg }}
                  thumbColor={rules[rule.id] ? colors.amber : colors.ink3}
                />
              </View>
            ))}
          </WKCard>

          {/* Max Stay Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum Stay</Text>
            <Text style={styles.sectionHint}>
              Set the longest duration for a single stay (in days)
            </Text>
            <WKInput
              label="Days"
              value={maxStayDays}
              onChangeText={setMaxStayDays}
              keyboardType="number-pad"
              placeholder="30"
            />
          </View>

          {/* Additional Guidelines */}
          <WKCard variant="gold">
            <View style={styles.guidelineHeader}>
              <Ionicons name="checkmark" size={20} color={colors.amber} />
              <Text style={styles.guidelineTitle}>Host Tips</Text>
            </View>
            <View style={styles.guidelineList}>
              <Text style={styles.guidelineItem}>
                Be specific about your expectations (quiet hours, kitchen use, etc.)
              </Text>
              <Text style={styles.guidelineItem}>
                Consistent rules help walkers know if your place is right for them
              </Text>
              <Text style={styles.guidelineItem}>
                Consider flexibility during festivals and peak walking seasons
              </Text>
            </View>
          </WKCard>

          {/* Save Button */}
          <WKButton
            title="Save House Rules"
            onPress={handleSave}
            fullWidth
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ruleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  ruleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleLabel: {
    ...typography.body,
    color: colors.ink,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  guidelineTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  guidelineList: {
    gap: spacing.md,
  },
  guidelineItem: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
  saveBtn: {
    marginBottom: spacing.lg,
  },
});
