import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { unblockUser } from '../../../src/lib/blocking';
import { ProfileRow } from '../../../src/types/database';

interface BlockedUserData {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked?: ProfileRow;
}

export default function PrivacyScreen() {
  useAuthGuard();
  const { profile, updateProfile } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const [privacySettings, setPrivacySettings] = useState({
    show_location: profile?.show_location ?? false,
    show_walking_status: profile?.show_walking_status ?? false,
    show_stats: profile?.show_stats ?? false,
  });

  useEffect(() => {
    if (profile) {
      setPrivacySettings({
        show_location: profile.show_location,
        show_walking_status: profile.show_walking_status,
        show_stats: profile.show_stats,
      });
      loadBlockedUsers();
    }
  }, [profile]);

  const loadBlockedUsers = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*, blocked:profiles!blocked_users_blocked_id_fkey(*)')
        .eq('blocker_id', profile.id);

      if (!error && data) {
        setBlockedUsers(data as BlockedUserData[]);
      }
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyToggle = async (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    if (profile?.id) {
      await updateProfile({ [key]: value });
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!profile?.id) return;
    try {
      setUnblocking(blockedId);
      const success = await unblockUser(profile.id, blockedId);
      if (success) {
        setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Privacy & Blocking" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Toggles Section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Privacy Settings</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Show Location</Text>
                <Text style={styles.settingSubtitle}>Let others see your current location</Text>
              </View>
              <Switch
                value={privacySettings.show_location}
                onValueChange={value => handlePrivacyToggle('show_location', value)}
                trackColor={{ false: colors.borderLt, true: colors.amberLine }}
                thumbColor={privacySettings.show_location ? colors.amber : colors.ink3}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Show Walking Status</Text>
                <Text style={styles.settingSubtitle}>Let others see if you're actively walking</Text>
              </View>
              <Switch
                value={privacySettings.show_walking_status}
                onValueChange={value => handlePrivacyToggle('show_walking_status', value)}
                trackColor={{ false: colors.borderLt, true: colors.amberLine }}
                thumbColor={privacySettings.show_walking_status ? colors.amber : colors.ink3}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Show Stats</Text>
                <Text style={styles.settingSubtitle}>Let others see your stamps, tier & nights walked</Text>
              </View>
              <Switch
                value={privacySettings.show_stats}
                onValueChange={value => handlePrivacyToggle('show_stats', value)}
                trackColor={{ false: colors.borderLt, true: colors.amberLine }}
                thumbColor={privacySettings.show_stats ? colors.amber : colors.ink3}
              />
            </View>
          </View>
        </View>

        {/* Blocked Users Section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Blocked Users</Text>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.amber} />
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color={colors.ink3} />
              <Text style={styles.emptyStateText}>You haven't blocked anyone</Text>
            </View>
          ) : (
            <View style={styles.blockedList}>
              {blockedUsers.map(item => {
                const blocked = item.blocked as ProfileRow | undefined;
                return (
                  <View key={item.blocked_id} style={styles.blockedUserCard}>
                    <View style={styles.blockedUserInfo}>
                      <View style={styles.blockedUserAvatar}>
                        {blocked?.avatar_url ? (
                          <Ionicons name="person-circle-outline" size={40} color={colors.amber} />
                        ) : (
                          <Ionicons name="person-outline" size={40} color={colors.ink3} />
                        )}
                      </View>
                      <View style={styles.blockedUserContent}>
                        <Text style={styles.blockedUserName}>
                          {blocked?.trail_name || 'Unknown User'}
                        </Text>
                        <Text style={styles.blockedUserSubtext}>
                          Blocked {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() => handleUnblock(item.blocked_id)}
                      disabled={unblocking === item.blocked_id}
                      activeOpacity={0.7}
                    >
                      {unblocking === item.blocked_id ? (
                        <ActivityIndicator size="small" color={colors.ink} />
                      ) : (
                        <Text style={styles.unblockButtonText}>Unblock</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    justifyContent: 'space-between',
  },
  settingRow_last: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.ink3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  emptyStateText: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.md,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  blockedList: {
    gap: spacing.md,
  },
  blockedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  blockedUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  blockedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedUserContent: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  blockedUserSubtext: {
    ...typography.caption,
    color: colors.ink3,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unblockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
});
