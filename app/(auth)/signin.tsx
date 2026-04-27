import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { WebAuthScreen } from '../../src/components/web/WebAuthScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKInput } from '../../src/components/ui/WKInput';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

export default function SignInScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();
  if (Platform.OS === 'web') {
    return <WebAuthScreen mode="signin" />;
  }



  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';

    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrors({ form: 'Invalid email or password' });
        return;
      }

      // Navigation will be handled by the auth state change in index.tsx
      router.replace('/');
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Welcome Back" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {errors.form && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorBannerText}>{errors.form}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

        <WKInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <WKInput
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotContainer}
        >
          <Text style={styles.forgotLink}>Forgot your password?</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Sign In"
          onPress={handleSignIn}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.signupLink}>Not yet a Wanderkind? Join now</Text>
        </TouchableOpacity>
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
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.redBg,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
  },
  forgotContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  forgotLink: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  signupLink: {
    ...typography.bodySm,
    color: colors.amber,
    textAlign: 'center',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLt,
  },
  dividerText: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderLt,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  googleBtnText: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#000000',
    marginTop: 10,
  },
  appleBtnDisabled: {
    opacity: 0.6,
  },
  appleBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
