import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useSettings, AppLanguage } from '../../../../src/stores/settings';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'cz', name: 'Čeština' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'el', name: 'Ελληνικά' },
];

export default function LanguageScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { language: selected, setLanguage } = useSettings();

  const handleSelect = (code: string) => {
    setLanguage(code as AppLanguage);
    setTimeout(() => router.back(), 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Language" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langGrid}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langButton,
                selected === lang.code && styles.langButtonSelected,
              ]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {selected === lang.code && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.langName,
                  selected === lang.code && styles.langNameSelected,
                ]}
              >
                {lang.name}
              </Text>
              {selected === lang.code && (
                <Ionicons name="checkmark" size={18} color={colors.amber} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  langGrid: { gap: spacing.sm },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.md,
  },
  langButtonSelected: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  langName: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  langNameSelected: { fontWeight: '600', color: colors.amber },
});
