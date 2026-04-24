import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

interface PrivacySettings {
  show_location: boolean;
  show_walking_status: boolean;
  show_stats: boolean;
  quiet_mode: boolean;
}

export default function PrivacyScreen() {
  const { profile, user, fetchProfile } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_location: true,
    show_walking_status: true,
    show_stats: true,
    quiet_mode: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSettings({
        show_location: profile.show_location ?? true,
        show_walking_status: profile.show_walking_status ?? true,
        show_stats: profile.show_stats ?? true,
        quiet_mode: profile.quiet_mode ?? false,
      });
    }
  }, [profile]);

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setSaving(true);
    try {
      if (!user) return;

      const updateData: any = {};
      updateData[key] = newSettings[key];

      await supabase.from('profiles').update(updateData).eq('id', user.id);
      await fetchProfile();
    } catch (err) {
      console.error('Error saving:', err);
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    {
      key: 'show_location' as const,
      title: 'Show Location',
      description: 'Allow others to see your general location',
      icon: 'location',
    },
    {
      key: 'show_walking_status' as const,
      title: 'Show Walking Status',
      description: 'Let others know if you\'re currently walking',
      icon: 'walk',
    },
    {
      key: 'show_stats' as const,
      title: 'Show Statistics',
      description: 'Display your nights walked and stamps collected',
      icon: 'bar-chart',
    },
    {
      key: 'quiet_mode' as const,
      title: 'Quiet Mode',
      description: 'Hide gamification elements and achievement notifications',
      icon: 'volume-mute',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Privacy Settings" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Control what others can see about you
        </Text>

        {privacyOptions.map(option => (
          <WKCard key={option.key} style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name={option.icon as any} size={24} color={colors.amber} />
              </View>

              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingDesc}>{option.description}</Text>
              </View>

              <Switch
                value={settings[option.key]}
                onValueChange={() => toggleSetting(option.key)}
                trackColor={{ false: colors.border, true: colors.amberBg }}
                thumbColor={settings[option.key] ? colors.amber : colors.ink3}
                disabled={saving}
              />
            </View>
          </WKCard>
        ))}

        <WKCard variant="gold">
          <Text style={styles.title}>Privacy is Sacred</Text>
          <Text style={styles.description}>
            Your data belongs to you. We never share personal information with third parties, and you have full control over your privacy settings.
          </Text>
        </WKCard>

        <WKCard>
          <Text style={styles.title}>Data Practices</Text>
          <View style={styles.practicesList}>
            <View style={styles.practiceItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.practiceText}>No third-party data sharing</Text>
            </View>
            <View style={styles.practiceItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.practiceText}>Encrypted connections</Text>
            </View>
            <View style={styles.practiceItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.practiceText}>You can delete your data anytime</Text>
            </View>
          </View>
        </WKCard>
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  settingCard: {
    marginBottom: spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  settingDesc: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  practicesList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  practiceText: {
    ...typography.body,
    color: colors.ink2,
  },
});
