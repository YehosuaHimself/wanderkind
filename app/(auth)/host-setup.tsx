import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKInput } from '../../src/components/ui/WKInput';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

export default function HostSetupScreen() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [bedType, setBedType] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { updateProfile } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim()) newErrors.address = 'Address is required';
    if (!bedType.trim()) newErrors.bedType = 'Bed type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({
        host_address: address,
        host_bed_type: bedType,
        host_bio: description,
        is_host: true,
      });

      if (error) {
        setErrors({ form: 'Failed to save host information' });
        return;
      }

      router.push('/(auth)/home-photo');
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/permissions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Open Your Door" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Every Wanderkind is a host. Tell other pilgrims about your space.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.amber} />
          <Text style={styles.infoText}>
            Your hosting information helps walkers find safe places to rest.
          </Text>
        </View>

        {errors.form && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorBannerText}>{errors.form}</Text>
          </View>
        )}

        <WKInput
          label="Your Address"
          placeholder="City, Country"
          value={address}
          onChangeText={setAddress}
          error={errors.address}
        />

        <WKInput
          label="What Can You Offer?"
          placeholder="e.g., Single bed, Shared room, Couch, Garden space"
          value={bedType}
          onChangeText={setBedType}
          error={errors.bedType}
        />

        <WKInput
          label="About Your Place (Optional)"
          placeholder="Tell pilgrims about your home, meals, experiences..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.helperText}>
          You can update this information anytime from your profile.
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />
        <Text
          style={styles.skipText}
          onPress={handleSkip}
        >
          Skip for now
        </Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
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
  helperText: {
    ...typography.bodySm,
    color: colors.ink3,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  skipText: {
    ...typography.bodySm,
    color: colors.ink3,
    textAlign: 'center',
  },
});
