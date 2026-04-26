import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Platform, Image, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { showAlert } from '../../../src/lib/alert';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';

export default function WanderHostScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();

  // Hosting state
  const [isHosting, setIsHosting] = useState(true);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [showSnoozeConfirm, setShowSnoozeConfirm] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    if (profile) {
      setIsHosting(profile?.is_hosting ?? true);
      setIsSnoozed(profile?.hosting_snoozed ?? false);
    }
    fetchGuestCount();
  }, [profile]);

  const fetchGuestCount = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('stamps')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id);
      setGuestCount(count ?? 0);
    } catch {
      toast.error('Could not load guest count');
      setGuestCount(0);
    }
  };

  const toggleHosting = async (value: boolean) => {
    haptic.medium();
    const prev = isHosting;
    setIsHosting(value);
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_hosting: value } as any)
        .eq('id', user.id);
      if (error) {
        setIsHosting(prev);
        showAlert('Error', error.message);
      }
    }
  };

  const handleSnoozePress = () => {
    haptic.light();
    if (isSnoozed) {
      // Un-snooze immediately
      confirmSnooze(false);
    } else {
      // Show confirmation first
      setShowSnoozeConfirm(true);
    }
  };

  const confirmSnooze = async (snooze: boolean) => {
    haptic.success();
    setShowSnoozeConfirm(false);
    const prev = isSnoozed;
    setIsSnoozed(snooze);
    if (user) {
      const updates: any = {
        hosting_snoozed: snooze,
        hosting_snoozed_until: snooze
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) {
        setIsSnoozed(prev);
        showAlert('Error', error.message);
      } else if (snooze) {
        showAlert('Hosting Snoozed', 'Your listing is hidden for 24 hours. Wanderkinder won\'t see your place on the map until then.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerLabel}>
            <Ionicons name="home" size={14} color={colors.amber} />
            <Text style={styles.headerLabelText}>WANDERHOST</Text>
          </View>
          <Text style={styles.headerTitle}>Your Hosting Home</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HOSTING STATUS CARD ===== */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusDot, isHosting && !isSnoozed && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isSnoozed ? 'Snoozed (24h)' : isHosting ? 'Hosting Active' : 'Hosting Paused'}
              </Text>
            </View>
            <Switch
              value={isHosting}
              onValueChange={toggleHosting}
              trackColor={{ false: colors.border, true: colors.amberBg }}
              thumbColor={isHosting ? colors.amber : colors.ink3}
            />
          </View>
          <Text style={styles.statusSub}>
            {isHosting && !isSnoozed
              ? 'Wanderkinder can see your place on the map and send requests.'
              : isSnoozed
                ? 'Your listing is temporarily hidden. It will reappear automatically.'
                : 'Turn on to welcome Wanderkinder to your home.'}
          </Text>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{guestCount}</Text>
              <Text style={styles.quickStatLabel}>GUESTS HOSTED</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{profile?.host_rating?.toFixed(1) ?? '—'}</Text>
              <Text style={styles.quickStatLabel}>RATING</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{profile?.response_time ?? '—'}</Text>
              <Text style={styles.quickStatLabel}>RESPONSE</Text>
            </View>
          </View>
        </View>

        {/* ===== MAIN SECTIONS ===== */}
        <Text style={styles.sectionTitle}>YOUR SPACE</Text>

        {/* My House */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/me/host-listing' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.amberBg }]}>
            <Ionicons name="bed-outline" size={22} color={colors.amber} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My House</Text>
            <Text style={styles.menuSub}>Beds, features, photos, house rules</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* Gaestebuch */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/me/gaestebuch' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="book-outline" size={22} color="#7C3AED" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Gästebuch</Text>
            <Text style={styles.menuSub}>Guest reviews, messages, and memories</Text>
          </View>
          {guestCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{guestCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* My Project */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/me/my-project' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="hammer-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Project</Text>
            <Text style={styles.menuSub}>Tell Wanderkinder what you're building</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* ===== ACCESS & ARRIVAL ===== */}
        <Text style={styles.sectionTitle}>ACCESS & ARRIVAL</Text>

        {/* Pin / Gate Code */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/more/wanderhost-access' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="key-outline" size={22} color="#D97706" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Pin & Gate Code</Text>
            <Text style={styles.menuSub}>Entry codes shared with confirmed guests only</Text>
          </View>
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.green} />
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* Arrival Instructions */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/more/wanderhost-arrival' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="navigate-outline" size={22} color="#059669" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Arrival Instructions</Text>
            <Text style={styles.menuSub}>Directions, landmarks, check-in times</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* ===== HOSTING SETTINGS ===== */}
        <Text style={styles.sectionTitle}>SETTINGS</Text>

        {/* Snooze Hosting */}
        <TouchableOpacity
          style={[styles.menuCard, isSnoozed && styles.menuCardSnoozed]}
          onPress={handleSnoozePress}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: isSnoozed ? '#FEE2E2' : colors.surfaceAlt }]}>
            <Ionicons
              name={isSnoozed ? 'alarm-outline' : 'moon-outline'}
              size={22}
              color={isSnoozed ? colors.red : colors.ink2}
            />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>
              {isSnoozed ? 'Un-Snooze Hosting' : 'Snooze for 24 Hours'}
            </Text>
            <Text style={styles.menuSub}>
              {isSnoozed
                ? 'Tap to make your listing visible again'
                : 'Temporarily hide your listing from the map'}
            </Text>
          </View>
          <Ionicons
            name={isSnoozed ? 'play-circle' : 'pause-circle'}
            size={24}
            color={isSnoozed ? colors.green : colors.ink3}
          />
        </TouchableOpacity>

        {/* Guest Preferences */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/more/wanderhost-prefs' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="options-outline" size={22} color={colors.ink2} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Guest Preferences</Text>
            <Text style={styles.menuSub}>Max guests, stay duration, languages</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/more/wanderhost-notifications' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="notifications-outline" size={22} color={colors.ink2} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Hosting Notifications</Text>
            <Text style={styles.menuSub}>Requests, messages, reminders</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* Contribute */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/more/contribute' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="heart-outline" size={22} color={colors.ink2} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Contribute & Give Back</Text>
            <Text style={styles.menuSub}>Support the Wanderkind community</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>

        {/* ===== LIABILITY DISCLAIMER ===== */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerIcon}>
            <Ionicons name="shield-outline" size={16} color={colors.ink3} />
          </View>
          <Text style={styles.disclaimerText}>
            By hosting through Wanderkind, you agree that you are solely responsible for the safety and condition of your space. Wanderkind is a platform connecting walkers and hosts — we do not inspect properties, verify conditions, or assume liability for any incidents, damages, or injuries that may occur during a stay. You are responsible for ensuring your space meets local safety and legal requirements. Guests stay at their own risk. Please review our{' '}
            <Text style={styles.disclaimerLink} onPress={() => router.push('/(tabs)/more/terms' as any)}>
              Terms of Service
            </Text>
            {' '}for full details.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== SNOOZE CONFIRMATION MODAL ===== */}
      <Modal
        visible={showSnoozeConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSnoozeConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="moon-outline" size={32} color={colors.amber} />
            </View>
            <Text style={styles.modalTitle}>Snooze Hosting?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to snooze hosting for 24 hours? Your listing will be temporarily hidden from the map. Wanderkinder won't be able to find or request your place during this time.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSnoozeConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => confirmSnooze(true)}
              >
                <Ionicons name="moon" size={14} color="#fff" />
                <Text style={styles.modalConfirmText}>Yes, Snooze</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  backBtn: { width: 28 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerLabelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.ink,
  },

  scrollContent: {
    padding: spacing.lg,
  },

  // Status Card
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink3,
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  statusSub: {
    fontSize: 13,
    color: colors.ink3,
    lineHeight: 18,
    marginBottom: 14,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 12,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  quickStatLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 7,
    letterSpacing: 1.5,
    color: colors.ink3,
    marginTop: 2,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.borderLt,
  },

  // Section Titles
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },

  // Menu Cards
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  menuCardSnoozed: {
    borderColor: 'rgba(176,58,58,0.2)',
    backgroundColor: '#FFF5F5',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: colors.ink3,
    lineHeight: 16,
  },
  badge: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  secureBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },

  // Liability Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.ink3,
    lineHeight: 17,
  },
  disclaimerLink: {
    color: colors.amber,
    fontWeight: '600',
  },

  // Snooze Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
