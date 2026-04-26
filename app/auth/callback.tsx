import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { colors, typography } from '../../src/lib/theme';

/**
 * OAuth callback handler.
 *
 * After Google (or any OAuth provider) authenticates, Supabase redirects here
 * with session tokens in the URL hash. The Supabase client (with
 * detectSessionInUrl: true) automatically picks them up and establishes
 * the session. We just wait for that, then redirect into the app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // On native, deep links are handled differently
      router.replace('/(auth)/welcome');
      return;
    }

    // On web, Supabase detects the hash fragment automatically.
    // We listen for the session to be established.
    const handleCallback = async () => {
      try {
        // Give Supabase a moment to process the URL hash
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (data.session) {
          // Session established — check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('trail_name')
            .eq('id', data.session.user.id)
            .single();

          if (profile?.trail_name) {
            // Existing user with complete profile
            router.replace('/(tabs)');
          } else {
            // New Google user — needs to set trail name
            router.replace('/(auth)/trail-name');
          }
        } else {
          // No session yet — wait for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                subscription.unsubscribe();

                const { data: profile } = await supabase
                  .from('profiles')
                  .select('trail_name')
                  .eq('id', session.user.id)
                  .single();

                if (profile?.trail_name) {
                  router.replace('/(tabs)');
                } else {
                  router.replace('/(auth)/trail-name');
                }
              }
            }
          );

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            setError('Authentication timed out. Please try again.');
          }, 10000);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.link}
          onPress={() => router.replace('/(auth)/welcome')}
        >
          Back to Welcome
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.amber} />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  text: {
    ...typography.body,
    color: colors.ink2,
    marginTop: 16,
  },
  errorText: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    ...typography.body,
    color: colors.amber,
    fontWeight: '600',
  },
});
