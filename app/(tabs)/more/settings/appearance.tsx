import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useSettings, AppTheme } from '../../../../src/stores/settings';

export default function AppearanceScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const {
    theme, setTheme,
    textSize, setTextSize,
    reduceMotion, setReduceMotion,
    highContrast, setHighContrast,
  } = useSettings();

  const themes = [
    { id: 'light', label: 'Light', icon: 'sunny-outline' as const },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Appearance" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Theme</Text>
          <View style={styles.themeGrid}>
            {themes.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeButton,
                  theme === t.id && styles.themeButtonSelected,
                ]}
                onPress={() => setTheme(t.id as AppTheme)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={t.icon}
                  size={32}
                  color={theme === t.id ? colors.amber : colors.ink3}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    theme === t.id && styles.themeLabelSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Size */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Text Size</Text>
          <WKCard>
            <View style={styles.textSizePreview}>
              <Text
                style={[
                  typography.body,
                  {
                    fontSize: 15 * (0.8 + textSize * 0.4),
                    color: colors.ink,
                  },
                ]}
              >
                Sample Text
              </Text>
            </View>

            <View style={styles.sizeLabels}>
              {[0, 0.25, 0.5, 0.75, 1].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeStep, textSize === size && styles.sizeStepActive]}
                  onPress={() => setTextSize(size)}
                  accessibilityLabel={`Text size ${Math.round((0.8 + size * 0.4) * 100)}%`}
                >
                  <Text style={[
                    styles.sizeStepLabel,
                    { fontSize: 12 + size * 6 },
                    textSize === size && styles.sizeStepLabelActive,
                  ]}>A</Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>
        </View>

        {/* Display Options */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Display</Text>
          <View style={styles.optionsList}>
            <View style={styles.optionRow}>
              <Text style={[typography.body, styles.optionLabel]}>
                Reduce Motion
              </Text>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: colors.borderLt, true: colors.amberBg }}
                thumbColor={reduceMotion ? colors.amber : '#f4f3f4'}
                accessibilityLabel="Reduce motion"
              />
            </View>
            <View style={styles.optionRow}>
              <Text style={[typography.body, styles.optionLabel]}>
                High Contrast
              </Text>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                trackColor={{ false: colors.borderLt, true: colors.amberBg }}
                thumbColor={highContrast ? colors.amber : '#f4f3f4'}
                accessibilityLabel="High contrast mode"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, color: colors.amber },
  themeGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  themeButtonSelected: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  themeLabel: { ...typography.bodySm, color: colors.ink3, marginTop: spacing.sm },
  themeLabelSelected: { color: colors.amber, fontWeight: '600' },
  textSizePreview: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    marginBottom: spacing.md,
  },
  sizeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sizeStep: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  sizeStepActive: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  sizeStepLabel: {
    fontWeight: '600',
    color: colors.ink3,
  },
  sizeStepLabelActive: {
    color: colors.amber,
  },
  optionsList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  optionLabel: { color: colors.ink, flex: 1 },
  // Toggle styles removed — using native Switch component
});
