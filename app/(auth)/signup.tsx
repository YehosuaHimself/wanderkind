import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKInput } from '../../src/components/ui/WKInput';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);

  const isMinor = birthYear ? (new Date().getFullYear() - parseInt(birthYear, 10)) < 18 : false;

  const { signUp, signInWithGoogle } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) newErrors.password = 'Include at least one uppercase letter and one number';

    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!birthYear) newErrors.birthYear = 'Birth year is required';
    else {
      const year = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      if (year > currentYear || year < 1900) newErrors.birthYear = 'Please enter a valid birth year';
      else if (currentYear - year < 13) newErrors.birthYear = 'You must be at least 13 years old';
    }

    if (!agreeTerms) newErrors.terms = 'You must agree to the terms';
    if (isMinor && !parentConsent) newErrors.parent = 'Parent or guardian consent is required for users under 18';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password, '', (role as any) || 'both', 'en');
      if (error) {
        setErrors({ form: error.message });
        return;
      }

      router.push('/(auth)/trail-name');
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Create Your Pass" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {errors.form && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorBannerText}>{errors.form}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>Your email and password secure your pass.</Text>

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
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <WKInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <WKInput
          label="Birth Year"
          placeholder="1990"
          value={birthYear}
          onChangeText={setBirthYear}
          keyboardType="number-pad"
          maxLength={4}
          error={errors.birthYear}
          helper="You must be at least 13 years old"
        />

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={agreeTerms ? 'checkbox' : 'checkbox-outline'}
              size={20}
              color={agreeTerms ? colors.amber : colors.ink3}
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
        {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

        {isMinor && (
          <>
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setParentConsent(!parentConsent)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={parentConsent ? 'checkbox' : 'checkbox-outline'}
                  size={20}
                  color={parentConsent ? colors.amber : colors.ink3}
                />
              </TouchableOpacity>
              <Text style={styles.termsText}>
                My parent or guardian has given permission for me to use this app
              </Text>
            </View>
            {errors.parent && <Text style={styles.error}>{errors.parent}</Text>}
          </>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Create Pass"
          onPress={handleSignUp}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={async () => {
            const { error } = await signInWithGoogle();
            if (error) setErrors({ form: error.message });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-google" size={18} color={colors.ink} />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={styles.loginLink}>Already have a pass? Sign in</Text>
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
  error: {
    fontSize: 11,
    color: colors.red,
    marginTop: -10,
    marginBottom: spacing.md,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  checkbox: {
    marginTop: 2,
  },
  termsText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  link: {
    color: colors.amber,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  loginLink: {
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
});
