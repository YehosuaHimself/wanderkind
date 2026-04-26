import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKInput } from '../../../src/components/ui/WKInput';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function MyProjectScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setProjectTitle(profile.hosting_project_title || '');
      setProjectDescription(profile.hosting_project_desc || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!projectTitle.trim()) {
      setError('Project title is required');
      return;
    }

    setLoading(true);
    setError('');
    setSaved(false);

    try {
      if (!user) throw new Error('No user');

      const { error: updateError } = await supabase.from('profiles').update({
        hosting_project_title: projectTitle,
        hosting_project_desc: projectDescription,
      }).eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="My Hosting Project" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            <Text style={styles.successText}>Project saved!</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Tell wanderers what makes your space special
        </Text>

        <WKCard variant="parchment" style={styles.exampleCard}>
          <View style={styles.exampleHeader}>
            <Ionicons name="bulb-outline" size={20} color={colors.amber} />
            <Text style={styles.exampleTitle}>Examples</Text>
          </View>
          <Text style={styles.exampleText}>
            "A mountain cabin with stunning views and home-cooked meals by the fire"
          </Text>
          <Text style={styles.exampleText}>
            "Urban garden project in the city center - learn about sustainable living"
          </Text>
        </WKCard>

        <WKInput
          label="Project Title"
          value={projectTitle}
          onChangeText={setProjectTitle}
          placeholder="e.g., Mountain Retreat, Urban Garden"
          maxLength={50}
        />

        <WKInput
          label="Project Description"
          value={projectDescription}
          onChangeText={setProjectDescription}
          placeholder="Describe what makes your hosting special..."
          maxLength={500}
          multiline
          numberOfLines={6}
        />

        <View style={styles.charCount}>
          <Text style={styles.charCountText}>
            {projectDescription.length}/500
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            Your project description appears on your listing and helps wanderers understand your vision.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Save Project"
          onPress={handleSave}
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
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.redBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: colors.greenBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  successText: {
    ...typography.bodySm,
    color: colors.green,
    flex: 1,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  exampleCard: {
    marginBottom: spacing.lg,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  exampleTitle: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  exampleText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
    marginBottom: spacing.md,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
