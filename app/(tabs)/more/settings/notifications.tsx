import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useSettings } from '../../../../src/stores/settings';

type NotificationSetting = {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
};

export default function NotificationsScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const { notifications, setNotification } = useSettings();

  const settings: NotificationSetting[] = [
    {
      key: 'messages',
      label: 'Messages',
      subtitle: 'New messages from walkers and hosts',
      icon: 'chatbubble-outline',
    },
    {
      key: 'bookingRequests',
      label: 'Booking Requests',
      subtitle: 'When someone requests to stay at your place',
      icon: 'calendar-outline',
    },
    {
      key: 'moments',
      label: 'Moments',
      subtitle: 'When friends post updates on their journey',
      icon: 'image-outline',
    },
    {
      key: 'systemUpdates',
      label: 'System Updates',
      subtitle: 'Important app updates and maintenance notices',
      icon: 'information-circle-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Notifications" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Notification Types</Text>
          <View style={styles.settingsList}>
            {settings.map((setting) => {
              const key = setting.key as keyof typeof notifications;
              const isOn = notifications[key];
              return (
                <View
                  key={setting.key}
                  style={styles.settingRow}
                >
                  <View style={styles.settingIcon}>
                    <Ionicons
                      name={setting.icon as any}
                      size={18}
                      color={colors.amber}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                    <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                  </View>
                  <Switch
                    value={isOn}
                    onValueChange={(val) => setNotification(key, val)}
                    trackColor={{ false: colors.border, true: colors.amberBg }}
                    thumbColor={isOn ? colors.amber : colors.ink3}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Notification Timing */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Timing</Text>
          <WKCard variant="gold">
            <Text style={[typography.body, { color: colors.ink2, lineHeight: 22 }]}>
              You can manage notification delivery times in your quiet hours settings. Default is 7 AM to 10 PM.
            </Text>
          </WKCard>
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
});
