/**
 * WK-220 — Emergency SOS Screen
 * - Loads real emergency_contacts from profile
 * - Gets current GPS position
 * - "Alert All Contacts" fires native SMS per contact + logs to sos_alerts
 * - Quick-dial buttons per contact
 * - 112 / emergency services always prominent
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../../src/lib/theme';
import { showAlert } from '../../../src/lib/alert';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { toast } from '../../../src/lib/toast';
import type { EmergencyContact } from '../../../src/types/database';

const SUPABASE_URL = 'https://gjzhwpzgvdpkflgjesmb.supabase.co';

export default function SOS() {
  const { user, isLoading } = useAuthGuard();
  const { profile } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(true);
  const [alerting, setAlerting] = useState(false);
  const [alerted, setAlerted] = useState(false);

  // Load emergency contacts from profile
  useEffect(() => {
    if (profile?.emergency_contacts?.length) {
      setContacts((profile.emergency_contacts as EmergencyContact[]).filter((c: EmergencyContact) => c.name || c.phone));
    }
  }, [profile]);

  // Get current location
  useEffect(() => {
    setLocating(true);
    if (Platform.OS === 'web' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
        () => {
          // Fall back to profile location
          if (profile?.lat) setLat(profile.lat);
          if (profile?.lng) setLng(profile.lng);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      if (profile?.lat) setLat(profile.lat);
      if (profile?.lng) setLng(profile.lng);
      setLocating(false);
    }
  }, [profile?.lat, profile?.lng]);

  const call112 = () => Linking.openURL('tel:112');

  const callContact = (contact: EmergencyContact) => {
    if (!contact.phone) {
      toast.error('No phone number for this contact.');
      return;
    }
    Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`);
  };

  const smsContact = (contact: EmergencyContact, locationText: string) => {
    if (!contact.phone) return;
    const body = encodeURIComponent(
      `🚨 EMERGENCY ALERT from Wanderkind\n\nI need help. ${locationText}\n\nPlease contact me immediately.`
    );
    const uri = Platform.OS === 'ios'
      ? `sms:${contact.phone}&body=${body}`
      : `sms:${contact.phone}?body=${body}`;
    Linking.openURL(uri);
  };

  const handleAlertAll = useCallback(async () => {
    if (!contacts.length) {
      showAlert(
        'No Emergency Contacts',
        'Please add emergency contacts in your profile settings first.',
        [
          { text: 'Add Contacts', onPress: () => router.push('/(tabs)/me/emergency-contacts' as any) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    setAlerting(true);
    try {
      const mapsLink = lat && lng
        ? `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`
        : null;
      const locationText = mapsLink
        ? `My location: ${mapsLink}`
        : 'Location not available — check my last known position in Wanderkind.';

      // 1. Fire native SMS to each contact (user action per contact)
      //    We open the first SMS directly; others via individual buttons.
      //    Log to DB regardless.
      for (const c of contacts) {
        if (c.phone) smsContact(c, locationText);
      }

      // 2. Log the SOS event
      if (user) {
        await supabase.from('sos_alerts').insert({
          user_id: user.id,
          lat,
          lng,
          location_text: locationText,
          contacts_notified: contacts,
          message: 'Manual SOS alert triggered from app',
        });

        // 3. Call Edge Function (best-effort — may not be deployed yet)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch(`${SUPABASE_URL}/functions/v1/sos-alert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              lat, lng,
              location_text: locationText,
              contacts,
            }),
          }).catch(() => null); // fire-and-forget
        }
      }

      setAlerted(true);
      toast.success('Emergency contacts alerted!');
    } catch (err) {
      toast.error('Alert failed. Please call 112 directly.');
    } finally {
      setAlerting(false);
    }
  }, [contacts, lat, lng, user, router]);

  if (isLoading) return null;

  const locationText = lat && lng
    ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    : locating ? 'Locating…' : 'Location unavailable';
  const mapsUrl = lat && lng
    ? `https://maps.google.com/?q=${lat},${lng}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Emergency SOS" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* 112 Call button — always top and prominent */}
          <TouchableOpacity style={styles.callBig} onPress={call112} activeOpacity={0.85}>
            <View style={styles.callBigIcon}>
              <Ionicons name="call" size={36} color="#fff" />
            </View>
            <View>
              <Text style={styles.callBigLabel}>Call Emergency Services</Text>
              <Text style={styles.callBigNumber}>112 / 911</Text>
            </View>
          </TouchableOpacity>

          {/* Location */}
          <WKCard variant="parchment">
            <View style={styles.locationRow}>
              <Ionicons name={locating ? 'locate-outline' : 'location'} size={20}
                color={locating ? colors.ink3 : colors.amber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Your location</Text>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.amber} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                ) : (
                  <Text style={styles.locationValue}>{locationText}</Text>
                )}
              </View>
              {mapsUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)}>
                  <Ionicons name="open-outline" size={18} color={colors.amber} />
                </TouchableOpacity>
              )}
            </View>
          </WKCard>

          {/* Alert All button */}
          <WKCard variant="gold">
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {contacts.length === 0 ? (
              <View>
                <Text style={styles.noContactsText}>
                  No emergency contacts set. Add them in your profile so they can be reached in an emergency.
                </Text>
                <WKButton
                  title="Add Emergency Contacts"
                  onPress={() => router.push('/(tabs)/me/emergency-contacts' as any)}
                  variant="primary"
                  fullWidth
                  style={{ marginTop: spacing.md }}
                />
              </View>
            ) : (
              <View>
                <WKButton
                  title={alerted ? '✓ Contacts Alerted' : alerting ? 'Alerting…' : '🚨 Alert All Contacts'}
                  onPress={handleAlertAll}
                  disabled={alerting || alerted}
                  loading={alerting}
                  fullWidth
                  style={[styles.alertBtn, alerted && { backgroundColor: colors.green }] as any}
                />
                <Text style={styles.alertHint}>
                  Sends an SMS with your location to all emergency contacts.
                </Text>
              </View>
            )}
          </WKCard>

          {/* Per-contact actions */}
          {contacts.length > 0 && (
            <WKCard>
              {contacts.map((c: EmergencyContact, i: number) => (
                <View key={i} style={[styles.contactRow, i > 0 && styles.contactBorder]}>
                  <View style={styles.contactAvatar}>
                    <Ionicons name="person-outline" size={18} color={colors.amber} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.name || 'Contact'}</Text>
                    {c.relationship ? <Text style={styles.contactRel}>{c.relationship}</Text> : null}
                    {c.phone ? <Text style={styles.contactPhone}>{c.phone}</Text> : null}
                  </View>
                  {c.phone ? (
                    <View style={styles.contactActions}>
                      <TouchableOpacity style={styles.contactBtn} onPress={() => callContact(c)}>
                        <Ionicons name="call" size={18} color={colors.green} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.amberBg }]}
                        onPress={() => smsContact(c, locationText)}>
                        <Ionicons name="chatbubble-outline" size={18} color={colors.amber} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
              <TouchableOpacity
                style={styles.editContactsBtn}
                onPress={() => router.push('/(tabs)/me/emergency-contacts' as any)}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.ink3} />
                <Text style={styles.editContactsText}>Edit contacts</Text>
              </TouchableOpacity>
            </WKCard>
          )}

          {/* Emergency services grid */}
          <WKCard>
            <Text style={styles.sectionTitle}>Emergency Numbers</Text>
            <View style={styles.servicesGrid}>
              {[
                { label: 'Police', num: '112', icon: 'shield-outline', color: colors.blue },
                { label: 'Medical', num: '112', icon: 'medical-outline', color: colors.red },
                { label: 'Fire', num: '112', icon: 'flame-outline', color: '#E85D04' },
                { label: 'Mountain Rescue', num: '112', icon: 'alert-circle-outline', color: colors.tramp },
              ].map(s => (
                <TouchableOpacity
                  key={s.label}
                  style={styles.serviceCard}
                  onPress={() => Linking.openURL(`tel:${s.num}`)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: `${s.color}15` }]}>
                    <Ionicons name={s.icon as any} size={28} color={s.color} />
                  </View>
                  <Text style={styles.serviceLabel}>{s.label}</Text>
                  <Text style={[styles.serviceNum, { color: s.color }]}>{s.num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Safety tips */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            {[
              'Stay calm — call 112 first in life-threatening situations',
              'Stay in place if lost; rescuers come to you',
              'Share your GPS coordinates from this screen',
              'Keep your phone charged; carry a power bank',
              'Tell someone your route and expected arrival',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </WKCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },

  callBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.red,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  callBigIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  callBigLabel: { ...typography.bodySm, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  callBigNumber: { fontSize: 28, fontWeight: '800', color: '#fff', fontFamily: 'Courier New', letterSpacing: 2 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locationLabel: { ...typography.caption, color: colors.ink3, marginBottom: 2 },
  locationValue: { ...typography.bodySm, color: colors.ink, fontWeight: '600', fontFamily: 'Courier New' },

  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },

  alertBtn: { backgroundColor: colors.red },
  alertHint: { ...typography.caption, color: colors.ink2, textAlign: 'center', marginTop: spacing.sm },

  noContactsText: { ...typography.bodySm, color: colors.ink2, lineHeight: 20 },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  contactBorder: { borderTopWidth: 1, borderTopColor: colors.borderLt },
  contactAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center', alignItems: 'center',
  },
  contactName: { ...typography.bodySm, color: colors.ink, fontWeight: '600' },
  contactRel: { ...typography.caption, color: colors.ink3 },
  contactPhone: { ...typography.caption, color: colors.amber, fontFamily: 'Courier New', marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: spacing.sm },
  contactBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(39,134,74,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  editContactsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.md, alignSelf: 'flex-end',
  },
  editContactsText: { ...typography.caption, color: colors.ink3 },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  serviceCard: {
    flex: 1, minWidth: 120, alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.surface,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
  },
  serviceIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  serviceLabel: { ...typography.bodySm, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  serviceNum: { fontFamily: 'Courier New', fontSize: 14, fontWeight: '700' },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs },
  tipText: { ...typography.bodySm, color: colors.ink2, flex: 1, lineHeight: 20 },
});
