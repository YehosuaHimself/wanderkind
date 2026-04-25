import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { showAlert } from '../../../src/lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// expo-location may not work on web — conditionally import
let Location: any = null;
if (Platform.OS !== 'web') {
  try { Location = require('expo-location'); } catch {}
}
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useAuth } from '../../../src/stores/auth';

type Contact = {
  name: string;
  phone: string;
  relation: string;
};

export default function EmergencyScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [location, setLocation] = useState<string | null>(null);
  const { profile } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);

  // Load emergency contacts from profile
  useEffect(() => {
    if (profile?.emergency_contacts && Array.isArray(profile.emergency_contacts) && profile.emergency_contacts.length > 0) {
      setEmergencyContacts(profile.emergency_contacts as Contact[]);
    } else {
      // Show placeholder prompting user to add contacts
      setEmergencyContacts([]);
    }
  }, [profile]);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API on web
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            },
            () => setLocation('Location permission denied')
          );
        } else {
          setLocation('Geolocation not available');
        }
        return;
      }
      if (!Location) {
        setLocation('Location not available on this platform');
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch (error) {
      setLocation('Unable to get location');
    }
  };

  const callEmergency = (number: string) => {
    showAlert(
      'Emergency Call',
      `Call ${number}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${number}`),
          style: 'destructive',
        },
      ]
    );
  };

  const emergencyNumbers = [
    { label: 'Emergency (112)', number: '112', icon: 'call-outline' as const },
    { label: 'Mountain Rescue', number: '112', icon: 'mountain-outline' as const },
    { label: 'Police', number: '112', icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Emergency" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Banner */}
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color={colors.surface} />
          <Text style={[typography.body, { color: colors.surface, fontWeight: '600' }]}>
            Emergency Resources
          </Text>
        </View>

        {/* Location Card */}
        <WKCard style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={20} color={colors.amber} />
            <Text style={[typography.h3, { color: colors.ink }]}>Your Location</Text>
          </View>
          <Text style={[typography.body, { color: colors.ink2, marginTop: spacing.md }]}>
            {location || 'Getting location...'}
          </Text>
          <WKButton
            title="Refresh Location"
            onPress={getLocation}
            variant="secondary"
            size="sm"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </WKCard>

        {/* Emergency Call Buttons */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Quick Call</Text>
          <View style={styles.buttonGrid}>
            {emergencyNumbers.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={styles.emergencyButton}
                onPress={() => callEmergency(item.number)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon} size={28} color={colors.surface} />
                <Text style={styles.emergencyButtonText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Emergency Contacts</Text>
          <View style={styles.contactsList}>
            {emergencyContacts.length === 0 ? (
              <View style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.ink3 }]}>No emergency contacts set</Text>
                  <Text style={styles.contactRelation}>Add contacts in ME → Emergency Contacts</Text>
                </View>
              </View>
            ) : (
              emergencyContacts.map((contact, idx) => (
                <View key={idx} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relation}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callEmergency(contact.phone)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.amber} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Safety Tips</Text>
          <WKCard variant="parchment">
            {[
              'Stay on marked trails',
              'Tell someone your route and expected arrival',
              'Check weather before you walk',
              'Carry a fully charged phone',
              'Know your blood type and allergies',
            ].map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.amber} />
                <Text style={[typography.bodySm, { color: colors.ink2, flex: 1 }]}>
                  {tip}
                </Text>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.red,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  locationCard: { marginBottom: spacing.xl },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, color: colors.amber },
  buttonGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emergencyButtonText: {
    color: colors.surface,
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  contactsList: { gap: spacing.sm },
  contactCard: {
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
  contactInfo: { flex: 1 },
  contactName: { ...typography.body, color: colors.ink, fontWeight: '600' },
  contactRelation: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
