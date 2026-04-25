import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import { unblockUser } from '../../../src/lib/blocking';
import { ProfileRow } from '../../../src/types/database';
import { toast } from '../../../src/lib/toast';

interface BlockedUserData {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked?: ProfileRow;
}

type MessagePref = 'everyone' | 'verified' | 'nobody';

export default function PrivacyScreen() {
  useAuthGuard();
  const { profile, updateProfile } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserData[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  // ── Privacy settings state ─────────────────────────────────────────
  const [settings, setSettings] = useState({
    // Visibility
    show_profile_public: profile?.show_profile_public ?? true,
    show_on_map: profile?.show_on_map ?? true,
    show_in_search: (profile as any)?.show_in_search ?? (profile?.searchable ?? true),
    // Location & Activity
    show_location: profile?.show_location ?? false,
    show_walking_status: profile?.show_walking_status ?? false,
    // Social
    show_stats: profile?.show_stats ?? false,
    allow_messages_from: ((profile as any)?.allow_messages_from ?? 'everyone') as MessagePref,
    // Stealth
    ghost_presence: profile?.ghost_presence ?? false,
    quiet_mode: profile?.quiet_mode ?? false,
  });

  useEffect(() => {
    if (profile) {
      setSettings({
        show_profile_public: (profile as any).show_profile_public ?? true,
        show_on_map: (profile as any).show_on_map ?? true,
        show_in_search: (profile as any).show_in_search ?? (profile.searchable ?? true),
        show_location: profile.show_location,
        show_walking_status: profile.show_walking_status,
        show_stats: profile.show_stats,
        allow_messages_from: ((profile as any).allow_messages_from ?? 'everyone') as MessagePref,
        ghost_presence: profile.ghost_presence,
        quiet_mode: profile.quiet_mode,
      });
      loadBlockedUsers();
    }
  }, [profile]);

  const loadBlockedUsers = async () => {
    if (!profile?.id) return;
    try {
      setLoadingBlocked(true);
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
      setLoadingBlocked(false);
    }
  };

  const handleToggle = useCallback(async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (profile?.id) {
      const { error } = await updateProfile({ [key]: value });
      if (error) {
        // Revert on failure
        setSettings(prev => ({ ...prev, [key]: !value }));
        toast.error('Could not update setting');
      }
    }
  }, [profile, updateProfile]);

  const handleMessagePref = useCallback(async (value: MessagePref) => {
    setSettings(prev => ({ ...prev, allow_messages_from: value }));
    if (profile?.id) {
      const { error } = await updateProfile({ allow_messages_from: value } as any);
      if (error) {
        toast.error('Could not update setting');
      }
    }
  }, [profile, updateProfile]);

  const handleUnblock = async (blockedId: string) => {
    if (!profile?.id) return;
    try {
      setUnblocking(blockedId);
      const success = await unblockUser(profile.id, blockedId);
      if (success) {
        setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
        toast.success('User unblocked');
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
      toast.error('Could not unblock user');
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Privacy & Trust" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Trust Statement ──────────────────────────────── */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.amber} />
          <Text style={styles.trustText}>
            Your data stays yours. Every setting here gives you full control over what others see. Wanderkind is built on trust between wanderers.
          </Text>
        </View>

        {/* ── Section 1: Who Can Find You ──────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHO CAN FIND YOU</Text>
          <Text style={styles.sectionDesc}>
            Control how you appear to other wanderkinder across the app.
          </Text>
          <View style={styles.settingsCard}>
            <PrivacyToggle
              title="Visible on Map"
              subtitle="Show your W marker on the map so nearby wanderkinder can see you"
              value={settings.show_on_map}
              onToggle={v => handleToggle('show_on_map', v)}
            />
            <PrivacyToggle
              title="Appear in Search"
              subtitle="Let others find you by trail name when searching for wanderkinder"
              value={settings.show_in_search}
              onToggle={v => handleToggle('show_in_search', v)}
              last={false}
            />
            <PrivacyToggle
              title="Public Profile"
              subtitle="Allow anyone with your link to view your profile. When off, only you see it."
              value={settings.show_profile_public}
              onToggle={v => handleToggle('show_profile_public', v)}
              last
            />
          </View>
        </View>

        {/* ── Section 2: Location & Activity ───────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCATION & ACTIVITY</Text>
          <Text style={styles.sectionDesc}>
            Decide how much of your journey is shared in real time.
          </Text>
          <View style={styles.settingsCard}>
            <PrivacyToggle
              title="Share Location"
              subtitle="Show your current position to other wanderkinder on the map"
              value={settings.show_location}
              onToggle={v => handleToggle('show_location', v)}
            />
            <PrivacyToggle
              title="Show Walking Status"
              subtitle="Let others see when you are actively walking on a way"
              value={settings.show_walking_status}
              onToggle={v => handleToggle('show_walking_status', v)}
              last
            />
          </View>
        </View>

        {/* ── Section 3: What Others See ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT OTHERS SEE</Text>
          <Text style={styles.sectionDesc}>
            Choose what information is visible on your profile.
          </Text>
          <View style={styles.settingsCard}>
            <PrivacyToggle
              title="Show Stats"
              subtitle="Display your stamps, tier, and nights walked on your profile"
              value={settings.show_stats}
              onToggle={v => handleToggle('show_stats', v)}
              last
            />
          </View>
        </View>

        {/* ── Section 4: Messages ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHO CAN MESSAGE YOU</Text>
          <Text style={styles.sectionDesc}>
            Control who can start a conversation with you.
          </Text>
          <View style={styles.settingsCard}>
            <MessagePrefOption
              label="Everyone"
              subtitle="Any wanderkind can send you a message"
              selected={settings.allow_messages_from === 'everyone'}
              onPress={() => handleMessagePref('everyone')}
            />
            <MessagePrefOption
              label="Verified only"
              subtitle="Only wanderkinder with a verified pass can message you"
              selected={settings.allow_messages_from === 'verified'}
              onPress={() => handleMessagePref('verified')}
            />
            <MessagePrefOption
              label="Nobody"
              subtitle="Disable incoming messages entirely"
              selected={settings.allow_messages_from === 'nobody'}
              onPress={() => handleMessagePref('nobody')}
              last
            />
          </View>
        </View>

        {/* ── Section 5: Stealth Mode ──────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STEALTH MODE</Text>
          <Text style={styles.sectionDesc}>
            For times when you need to walk in silence.
          </Text>
          <View style={styles.settingsCard}>
            <PrivacyToggle
              title="Ghost Presence"
              subtitle="Hide your online status completely. You will appear offline to everyone."
              value={settings.ghost_presence}
              onToggle={v => handleToggle('ghost_presence', v)}
              tint={colors.ink3}
            />
            <PrivacyToggle
              title="Quiet Mode"
              subtitle="Hide gamification elements like tiers and achievements. Just you and the road."
              value={settings.quiet_mode}
              onToggle={v => handleToggle('quiet_mode', v)}
              tint={colors.ink3}
              last
            />
          </View>
        </View>

        {/* ── Section 6: Blocked Users ─────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BLOCKED USERS</Text>
          <Text style={styles.sectionDesc}>
            Blocked wanderkinder cannot see your profile, send you messages, or find you on the map.
          </Text>

          {loadingBlocked ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.amber} />
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={36} color={colors.ink3} />
              <Text style={styles.emptyStateText}>No blocked users</Text>
              <Text style={styles.emptyStateSub}>
                You can block someone from their profile page if needed.
              </Text>
            </View>
          ) : (
            <View style={styles.blockedList}>
              {blockedUsers.map(item => {
                const blocked = item.blocked as ProfileRow | undefined;
                return (
                  <View key={item.blocked_id} style={styles.blockedUserCard}>
                    <View style={styles.blockedUserInfo}>
                      <View style={styles.blockedUserAvatar}>
                        <Ionicons name="person-outline" size={20} color={colors.ink3} />
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

        {/* ── Data & Account ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR DATA</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.dataRow} activeOpacity={0.7}>
              <View style={styles.dataRowLeft}>
                <Ionicons name="download-outline" size={18} color={colors.ink2} />
                <Text style={styles.dataRowText}>Request my data</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dataRow, styles.dataRowLast]} activeOpacity={0.7}>
              <View style={styles.dataRowLeft}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
                <Text style={[styles.dataRowText, { color: colors.red }]}>Delete my account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trust footer ─────────────────────────────────── */}
        <View style={styles.trustFooter}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.ink3} />
          <Text style={styles.trustFooterText}>
            Your privacy settings are encrypted and stored securely. Wanderkind never sells your data.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable Components ─────────────────────────────────────────────

function PrivacyToggle({
  title,
  subtitle,
  value,
  onToggle,
  tint,
  last,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  tint?: string;
  last?: boolean;
}) {
  const activeColor = tint || colors.amber;
  return (
    <View style={[styles.settingRow, last && styles.settingRowLast]}>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderLt, true: `${activeColor}40` }}
        thumbColor={value ? activeColor : colors.ink3}
      />
    </View>
  );
}

function MessagePrefOption({
  label,
  subtitle,
  selected,
  onPress,
  last,
}: {
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, last && styles.settingRowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // Trust banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.amberBg,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  trustText: {
    ...typography.bodySm,
    color: colors.ink,
    flex: 1,
    lineHeight: 20,
  },

  // Sections
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.amber,
  },
  sectionDesc: {
    ...typography.caption,
    color: colors.ink3,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },

  // Settings card
  settingsCard: {
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
    minHeight: 64,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.ink3,
    lineHeight: 16,
  },

  // Radio buttons for message pref
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderLt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: colors.amber,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.amber,
  },

  // Data rows
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dataRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },

  // Blocked users
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyStateSub: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  blockedList: {
    gap: spacing.sm,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingVertical: 8,
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

  // Trust footer
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trustFooterText: {
    ...typography.caption,
    color: colors.ink3,
    flex: 1,
    lineHeight: 16,
  },
});
