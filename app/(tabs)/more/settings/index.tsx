import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuth } from '../../../../src/stores/auth';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useSettings } from '../../../../src/stores/settings';
import { haptic } from '../../../../src/lib/haptics';

const LANG_NAMES: Record<string, string> = {
  en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español',
  it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski',
  cz: 'Čeština', sk: 'Slovenčina', hu: 'Magyar', ro: 'Română',
  sv: 'Svenska', no: 'Norsk', da: 'Dansk', el: 'Ελληνικά',
};

export default function SettingsScreen() {
  useAuthGuard();

  const router = useRouter();
  const { signOut, profile } = useAuth();
  const { language, theme } = useSettings();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/signin' as any);
  };

  const settingRows = [
    {
      label: 'Language',
      subtitle: LANG_NAMES[language] || 'English',
      icon: 'globe-outline' as const,
      onPress: () => {
        haptic.light();
        router.push('/(tabs)/more/settings/language' as any);
      },
    },
    {
      label: 'Notifications',
      subtitle: 'Manage alerts',
      icon: 'notifications-outline' as const,
      onPress: () => {
        haptic.light();
        router.push('/(tabs)/more/settings/notifications' as any);
      },
    },
    {
      label: 'Appearance',
      subtitle: `${theme === 'dark' ? 'Dark' : 'Light'} theme`,
      icon: 'contrast-outline' as const,
      onPress: () => {
        haptic.light();
        router.push('/(tabs)/more/settings/appearance' as any);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Trust & Settings" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Settings */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Preferences</Text>
          <View style={styles.settingsList}>
            {settingRows.map((row, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.settingRow}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name={row.icon} size={18} color={colors.amber} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{row.label}</Text>
                  <Text style={styles.settingSubtitle}>{row.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Account</Text>
          <WKCard>
            <View style={styles.accountInfo}>
              <View style={styles.accountIcon}>
                <Ionicons name="person-circle-outline" size={32} color={colors.amber} />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{profile?.trail_name || 'Your Trail Name'}</Text>
                <Text style={styles.accountEmail}>{profile?.email || ''}</Text>
              </View>
            </View>
          </WKCard>

          <View style={styles.accountActions}>
            <TouchableOpacity style={styles.accountButton} onPress={() => {
              haptic.light();
              router.push('/(tabs)/me/edit-profile' as any);
            }}>
              <Text style={styles.accountButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <WKButton
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            fullWidth
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              haptic.light();
              router.push('/(tabs)/me/delete-account' as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, color: colors.amber },
  settingsList: { gap: spacing.sm },
  settingRow: {
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
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.ink, fontWeight: '600' },
  settingSubtitle: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: { flex: 1 },
  accountName: { ...typography.body, color: colors.ink, fontWeight: '600' },
  accountEmail: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  accountActions: { gap: spacing.sm, marginTop: spacing.md },
  accountButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  accountButtonText: { ...typography.body, color: colors.amber, textAlign: 'center', fontWeight: '600' },
  deleteButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.redBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(176,58,58,0.18)',
    marginTop: spacing.md,
  },
  deleteButtonText: { ...typography.body, color: colors.red, textAlign: 'center', fontWeight: '600' },
});
