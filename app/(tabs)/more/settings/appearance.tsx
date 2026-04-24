import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Slider } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';

export default function AppearanceScreen() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [textSize, setTextSize] = useState(1);

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
                onPress={() => setTheme(t.id as 'light' | 'dark')}
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
              <Text style={styles.sizeLabel}>A</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.25}
                value={textSize}
                onValueChange={setTextSize}
                minimumTrackTintColor={colors.amber}
                maximumTrackTintColor={colors.border}
              />
              <Text style={[styles.sizeLabel, styles.sizeLabelLarge]}>A</Text>
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
              <TouchableOpacity
                style={styles.toggle}
                activeOpacity={0.7}
              >
                <View style={styles.toggleOff} />
              </TouchableOpacity>
            </View>
            <View style={styles.optionRow}>
              <Text style={[typography.body, styles.optionLabel]}>
                High Contrast
              </Text>
              <TouchableOpacity
                style={styles.toggle}
                activeOpacity={0.7}
              >
                <View style={styles.toggleOff} />
              </TouchableOpacity>
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
    gap: spacing.md,
  },
  sizeLabel: {
    fontSize: 12,
    color: colors.ink3,
    fontWeight: '600',
  },
  sizeLabelLarge: { fontSize: 16 },
  slider: {
    flex: 1,
    height: 40,
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
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
});
