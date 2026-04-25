import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// These modules may not work on web — conditionally import
let Location: any = null;
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try { Location = require('expo-location'); } catch {}
  try { Notifications = require('expo-notifications'); } catch {}
}
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../src/lib/theme';

export default function PermissionsScreen() {
  const router = useRouter();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation on web
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => { setLocationGranted(true); setDeniedMessage(''); },
            () => { setDeniedMessage('Location permission denied. You can enable it later in settings.'); }
          );
        } else {
          setDeniedMessage('Geolocation not available in this browser.');
        }
        return;
      }
      if (!Location) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        setDeniedMessage('');
      } else {
        setDeniedMessage('Location permission denied. You can enable it later in settings.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use browser Notification API on web
        if ('Notification' in window) {
          const permission = await window.Notification.requestPermission();
          if (permission === 'granted') {
            setNotificationsGranted(true);
            setDeniedMessage('');
          } else {
            setDeniedMessage('Notification permission denied. You can enable it later in settings.');
          }
        } else {
          setNotificationsGranted(true); // Skip on web if not supported
        }
        return;
      }
      if (!Notifications) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsGranted(true);
        setDeniedMessage('');
      } else {
        setDeniedMessage('Notification permission denied. You can enable it later in settings.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleContinue = async () => {
    // Request both permissions in parallel
    setLoading(true);
    try {
      const [locResult, notifResult] = await Promise.all([
        Location.requestForegroundPermissionsAsync(),
        Notifications.requestPermissionsAsync(),
      ]);

      setLocationGranted(locResult.status === 'granted');
      setNotificationsGranted(notifResult.status === 'granted');

      // Continue regardless of permissions granted
      router.push('/(auth)/onboarding-complete');
    } catch (error) {
      console.error(error);
      // Still continue on error
      router.push('/(auth)/onboarding-complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Permissions" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          These permissions help us give you the best experience.
        </Text>

        {deniedMessage && (
          <View style={styles.deniedBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.ink2} />
            <Text style={styles.deniedText}>{deniedMessage}</Text>
          </View>
        )}

        {/* Location Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionIcon}>
              <Ionicons name="location" size={24} color={colors.amber} />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Location</Text>
              <Text style={styles.permissionStatus}>
                {locationGranted ? 'Granted' : 'Not granted'}
              </Text>
            </View>
          </View>
          <Text style={styles.permissionDescription}>
            We use your location to show nearby hosts and help you navigate your way.
          </Text>
          <WKButton
            title={locationGranted ? 'Granted' : 'Request Permission'}
            onPress={requestLocationPermission}
            variant={locationGranted ? 'ghost' : 'secondary'}
            size="sm"
            fullWidth
          />
        </View>

        {/* Notification Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionIcon}>
              <Ionicons name="notifications" size={24} color={colors.amber} />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionStatus}>
                {notificationsGranted ? 'Granted' : 'Not granted'}
              </Text>
            </View>
          </View>
          <Text style={styles.permissionDescription}>
            Get notified when pilgrims message you or nearby hosts become available.
          </Text>
          <WKButton
            title={notificationsGranted ? 'Granted' : 'Request Permission'}
            onPress={requestNotificationPermission}
            variant={notificationsGranted ? 'ghost' : 'secondary'}
            size="sm"
            fullWidth
          />
        </View>

        <Text style={styles.helperText}>
          You can change these permissions anytime in your device settings.
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Begin Your Journey"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />
      </View>
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
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  deniedBanner: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  deniedText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  permissionHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  permissionStatus: {
    ...typography.caption,
    color: colors.ink3,
  },
  permissionDescription: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
