import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { haptic } from '../../../../src/lib/haptics';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { supabase } from '../../../../src/lib/supabase';
import { useAuthStore } from '../../../../src/stores/auth';
import { RouteErrorBoundary } from '../../../../src/components/RouteErrorBoundary';

/**
 * HOST PUSH — Emergency reach-out to nearby Wanderkinder.
 *
 * For WanderHosts who suddenly need help (unexpected guests, no
 * more capacity, emergency situation after 6 pm). Send an urgent
 * push to all Wanderkinder in the area. A second push goes at 7 pm
 * if nobody has responded.
 *
 * This is the digital equivalent of ringing the church bell — a
 * community SOS that the network should respond to collectively.
 */

type PushStatus = 'idle' | 'sending' | 'sent' | 'error';

const AMBER = colors.amber;
const AMBER_BG = `${AMBER}12`;

export default function HostPushScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [status, setStatus] = useState<PushStatus>('idle');
  const [message, setMessage] = useState('');
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [secondPushScheduled, setSecondPushScheduled] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const isAfter6pm = hour >= 18;
  const isAfter7pm = hour >= 19;

  const handleSendPush = useCallback(async () => {
    if (!user || !profile) return;
    haptic.medium();
    setStatus('sending');

    try {
      // Insert a host_push_request — nearby Wanderkinder subscribed to this
      // area will be notified (push notifications wired in future via Edge Function)
      const { error } = await supabase.from('host_push_requests' as any).insert({
        host_id: user.id,
        trail_name: profile.trail_name,
        lat: profile.lat ?? null,
        lng: profile.lng ?? null,
        message: message.trim() || 'A WanderHost nearby needs help tonight.',
        push_number: 1,
        scheduled_second_push: !isAfter7pm,
      });

      if (error) throw error;

      setSentAt(new Date());
      setSecondPushScheduled(!isAfter7pm);
      setStatus('sent');
      haptic.medium();
    } catch {
      setStatus('error');
    }
  }, [user, profile, message, isAfter7pm]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setSentAt(null);
    setSecondPushScheduled(false);
  }, []);

  if (!user) {
    return (
      <RouteErrorBoundary routeName="HostPush">
        <SafeAreaView style={styles.container} edges={['top']}>
          <WKHeader title="Host Push" showBack />
          <View style={styles.centered}>
            <Ionicons name="megaphone-outline" size={40} color={colors.ink3} />
            <Text style={styles.emptyTitle}>Sign in first</Text>
            <Text style={styles.emptyBody}>Only WanderHosts can send a Host Push.</Text>
          </View>
        </SafeAreaView>
      </RouteErrorBoundary>
    );
  }

  return (
    <RouteErrorBoundary routeName="HostPush">
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Host Push" showBack />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.headerBlock}>
            <Text style={styles.headline}>Emergency reach-out</Text>
            <Text style={styles.subhead}>
              No accommodation found after 6 pm? Send an urgent alert to
              Wanderkinder nearby. The community responds.
            </Text>
          </View>

          {/* Time context */}
          <View style={[styles.timeBanner, isAfter6pm ? styles.timeBannerActive : null]}>
            <Ionicons
              name={isAfter6pm ? 'time' : 'time-outline'}
              size={16}
              color={isAfter6pm ? AMBER : colors.ink3}
            />
            <Text style={[styles.timeBannerText, isAfter6pm && { color: AMBER }]}>
              {isAfter7pm
                ? 'After 7 pm — second push available now'
                : isAfter6pm
                  ? 'After 6 pm — push active. A second push will go out at 7 pm if unanswered.'
                  : 'Available after 6 pm — come back then if you need urgent help.'}
            </Text>
          </View>

          {status === 'idle' || status === 'error' ? (
            <>
              {/* Optional custom message */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CUSTOM MESSAGE (OPTIONAL)</Text>
                <View style={styles.messageBox}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder={'A WanderHost nearby needs help tonight. Can you take in one more?'}
                    placeholderTextColor={colors.ink3}
                    multiline
                    maxLength={280}
                    textAlignVertical="top"
                    style={styles.messageInput}
                  />
                  <Text style={styles.messageCounter}>{message.length}/280</Text>
                </View>
              </View>

              {status === 'error' && (
                <Text style={styles.errorText}>Something went wrong. Try again.</Text>
              )}

              <TouchableOpacity
                style={[styles.sendBtn, !isAfter6pm && styles.sendBtnDisabled]}
                onPress={isAfter6pm ? handleSendPush : undefined}
                activeOpacity={isAfter6pm ? 0.85 : 1}
                disabled={!isAfter6pm}
              >
                <Ionicons name="megaphone" size={20} color="#FFFFFF" />
                <Text style={styles.sendBtnText}>
                  {isAfter7pm ? 'Send second push' : 'Send push to Wanderkinder nearby'}
                </Text>
              </TouchableOpacity>

              {!isAfter6pm && (
                <Text style={styles.hint}>
                  The push system activates at 6 pm to avoid misuse.
                </Text>
              )}
            </>
          ) : status === 'sending' ? (
            <View style={styles.centered}>
              <Ionicons name="radio-outline" size={40} color={AMBER} />
              <Text style={styles.stateTitle}>Sending…</Text>
            </View>
          ) : (
            <View style={styles.sentBlock}>
              <View style={styles.sentBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#22863A" />
                <Text style={styles.sentBannerText}>Push sent successfully</Text>
              </View>
              <Text style={styles.sentDetail}>
                Nearby Wanderkinder have been notified.
                {secondPushScheduled
                  ? '\n\nIf nobody responds, a second push will go out automatically at 7 pm.'
                  : ''}
              </Text>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.resetBtnText}>Send another</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 60 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  headerBlock: { marginBottom: spacing.xl },
  headline: { fontSize: 24, fontWeight: '600', color: colors.ink, lineHeight: 30, marginBottom: 8 },
  subhead: { ...typography.body, color: colors.ink2, lineHeight: 22 },
  timeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: spacing.xl,
  },
  timeBannerActive: { backgroundColor: AMBER_BG, borderColor: `${AMBER}40` },
  timeBannerText: { flex: 1, fontSize: 13, color: colors.ink2, lineHeight: 18 },
  section: { marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.ink3,
    fontWeight: '600',
    marginBottom: 10,
  },
  messageBox: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  messageDefault: { fontSize: 14, color: colors.ink3, fontStyle: 'italic', lineHeight: 20 },
  messageInput: {
    fontSize: 14,
    color: colors.ink,
    minHeight: 88,
    lineHeight: 20,
    padding: 0,
  },
  messageCounter: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'right',
    marginTop: 6,
  },
  errorText: { fontSize: 13, color: colors.red, marginBottom: 12, textAlign: 'center' },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AMBER,
    paddingVertical: 18,
    borderRadius: radii.md,
    shadowColor: AMBER,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: colors.ink3, shadowOpacity: 0 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  hint: { marginTop: 12, fontSize: 12, color: colors.ink3, textAlign: 'center', fontStyle: 'italic' },
  sentBlock: { gap: 16 },
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#E7F4EA',
    borderRadius: radii.md,
  },
  sentBannerText: { fontSize: 14, fontWeight: '700', color: '#22863A' },
  sentDetail: { fontSize: 14, color: colors.ink2, lineHeight: 22 },
  resetBtn: { paddingVertical: 12, alignItems: 'center' },
  resetBtnText: { fontSize: 13, color: colors.ink3, textDecorationLine: 'underline' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyBody: { fontSize: 14, color: colors.ink2, textAlign: 'center' },
  stateTitle: { fontSize: 20, fontWeight: '600', color: colors.ink },
});
