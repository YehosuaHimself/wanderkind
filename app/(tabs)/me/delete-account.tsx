import React, { useState } from 'react';
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

export default function DeleteAccountScreen() {
  useAuthGuard();

  const router = useRouter();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('No user');

      // Delete user data
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Sign out and redirect
      await signOut();
      router.replace('/(auth)/signin' as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setLoading(false);
    }
  };

  if (step === 'warning') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Delete Account" showBack />

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.warningIcon}>
            <Ionicons name="alert-circle" size={64} color={colors.red} />
          </View>

          <Text style={styles.title}>This Cannot Be Undone</Text>

          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data, including:
          </Text>

          <View style={styles.consequencesList}>
            <View style={styles.consequence}>
              <Ionicons name="close-circle" size={18} color={colors.red} />
              <Text style={styles.consequenceText}>Your profile and trail name</Text>
            </View>
            <View style={styles.consequence}>
              <Ionicons name="close-circle" size={18} color={colors.red} />
              <Text style={styles.consequenceText}>All stamps and achievements</Text>
            </View>
            <View style={styles.consequence}>
              <Ionicons name="close-circle" size={18} color={colors.red} />
              <Text style={styles.consequenceText}>Messages and connections</Text>
            </View>
            <View style={styles.consequence}>
              <Ionicons name="close-circle" size={18} color={colors.red} />
              <Text style={styles.consequenceText}>Your hosting account</Text>
            </View>
          </View>

          <WKCard variant="gold">
            <Text style={styles.cardTitle}>Before You Go</Text>
            <Text style={styles.cardText}>
              Consider downloading your data first. You can email us to request a full backup.
            </Text>
          </WKCard>

          <Text style={styles.confirmQuestion}>
            Are you sure you want to continue?
          </Text>
        </ScrollView>

        <View style={styles.actions}>
          <WKButton
            title="I'm Sure, Continue"
            onPress={() => setStep('confirm')}
            variant="danger"
            size="lg"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Confirm Deletion" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.confirmIcon}>
          <Ionicons name="warning" size={48} color={colors.red} />
        </View>

        <Text style={styles.confirmTitle}>Final Confirmation</Text>

        <Text style={styles.confirmInstructions}>
          Type "DELETE" below to permanently delete your account and all associated data.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <WKInput
          label="Type to Confirm"
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="Type DELETE"
          placeholderTextColor={colors.ink3}
        />

        <View style={styles.warningCard}>
          <Ionicons name="information-circle" size={18} color={colors.red} />
          <Text style={styles.warningCardText}>
            This action is permanent and irreversible. Your account and all data will be deleted.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Cancel"
          onPress={() => setStep('warning')}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={loading}
        />
        <WKButton
          title="Delete My Account"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading || confirmText !== 'DELETE'}
          style={styles.deleteButton}
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
  warningIcon: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  confirmIcon: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.red,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmTitle: {
    ...typography.h2,
    color: colors.red,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  warningText: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  confirmInstructions: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  consequencesList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  consequence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  consequenceText: {
    ...typography.body,
    color: colors.ink2,
    flex: 1,
  },
  cardTitle: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  cardText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  confirmQuestion: {
    ...typography.body,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '600',
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.redBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  warningCardText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});
