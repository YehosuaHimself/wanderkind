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

export default function TrailNameScreen() {
  const router = useRouter();
  const [trailName, setTrailName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { profile, updateProfile } = useAuthStore();

  const validateName = () => {
    if (!trailName.trim()) {
      setError('Trail name is required');
      return false;
    }
    if (trailName.length < 2) {
      setError('Trail name must be at least 2 characters');
      return false;
    }
    if (trailName.length > 30) {
      setError('Trail name must be 30 characters or less');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateName()) return;

    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await updateProfile({ trail_name: trailName });
      if (updateError) {
        setError('Failed to save trail name');
        return;
      }

      router.push('/(auth)/select-way');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Your Trail Name" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Your trail name is how other Wanderkinder will know you on the road.
        </Text>

        <View style={styles.exampleCard}>
          <View style={styles.exampleIcon}>
            <Ionicons name="sparkles" size={20} color={colors.amber} />
          </View>
          <View style={styles.exampleContent}>
            <Text style={styles.exampleLabel}>Example trail names:</Text>
            <Text style={styles.exampleList}>Luna, Wanderer, Mountain Heart, Sky Seeker</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <WKInput
          label="Trail Name"
          placeholder="What shall we call you?"
          value={trailName}
          onChangeText={(text) => {
            setTrailName(text);
            setError('');
          }}
          maxLength={30}
        />

        <View style={styles.charCount}>
          <Text style={styles.charCountText}>
            {trailName.length}/30
          </Text>
        </View>

        <Text style={styles.helperText}>
          Your trail name appears on your profile, in messages, and on the map. Choose something that represents your spirit.
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
          disabled={loading || !trailName.trim()}
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
  exampleCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  exampleIcon: {
    marginTop: 2,
  },
  exampleContent: {
    flex: 1,
    gap: spacing.xs,
  },
  exampleLabel: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  exampleList: {
    ...typography.bodySm,
    color: colors.ink2,
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
  charCount: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: spacing.lg,
  },
  charCountText: {
    ...typography.caption,
    color: colors.ink3,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.ink3,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
