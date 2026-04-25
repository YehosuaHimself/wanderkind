import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { showAlert } from '../../../src/lib/alert';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';

const reportReasons = [
  { id: 'abuse', label: 'Abuse or harassment' },
  { id: 'false', label: 'False listing information' },
  { id: 'safety', label: 'Safety concern' },
  { id: 'spam', label: 'Spam or scam' },
];

interface ConfirmationScreenProps {
  onBack: () => void;
}

function ConfirmationScreen({ onBack }: ConfirmationScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Report" showBack={false} />

      <ScrollView
        contentContainerStyle={styles.confirmContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={56} color={colors.green} />
        </View>

        {/* Success Message */}
        <Text style={[typography.h2, styles.successTitle]}>Thank You</Text>
        <Text style={[typography.bodySm, styles.successMessage]}>
          Your report has been received. Our moderation team will review it and take appropriate action.
        </Text>

        {/* Info Card */}
        <WKCard variant="gold" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            We value the safety and integrity of the Wanderkind community. Your report helps us maintain a trustworthy space.
          </Text>
        </WKCard>

        {/* Action Buttons */}
        <WKButton
          title="Return to App"
          onPress={() => router.back()}
          variant="primary"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ReportUserScreen() {
  const router = useRouter();
  const { user_id } = useLocalSearchParams<{ user_id: string }>();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const descriptionLength = description.trim().length;
  const isValid = selectedReason && descriptionLength >= 20;

  const handleSubmit = async () => {
    if (!selectedReason) {
      showAlert('Missing Information', 'Please select a reason');
      return;
    }
    if (descriptionLength < 20) {
      showAlert('Missing Information', 'Description must be at least 20 characters');
      return;
    }

    setLoading(true);
    try {
      // Insert report into Supabase
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reported_user_id: user_id || null,
          reporter_id: user?.id || null,
          reason: selectedReason,
          description: description.trim(),
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Show confirmation screen
      setConfirmed(true);
    } catch (err) {
      console.error('Report submission error:', err);
      showAlert('Error', 'Error submitting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return <ConfirmationScreen onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Report" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            Help keep the Wanderkind community safe by reporting users who violate our community guidelines.
          </Text>
        </WKCard>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Reason for Report</Text>
          <View style={styles.reasonList}>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.id && styles.reasonButtonSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedReason === reason.id }}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedReason === reason.id && styles.radioCircleSelected,
                  ]}
                >
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark" size={14} color={colors.surface} />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.id && styles.reasonLabelSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Field */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[typography.label, styles.sectionLabel]}>Description</Text>
            <Text style={[typography.caption, styles.charCount]}>
              {descriptionLength} / 20 min
            </Text>
          </View>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Please provide details about what happened..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
        </View>

        {/* Submit Button */}
        <WKButton
          title="Submit Report"
          onPress={handleSubmit}
          variant="danger"
          fullWidth
          loading={loading}
          disabled={!isValid || loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  confirmContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '90%',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.red,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  charCount: {
    color: colors.ink3,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    minHeight: 44,
  },
  reasonButtonSelected: {
    backgroundColor: colors.redBg,
    borderColor: colors.red,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioCircleSelected: {
    borderColor: colors.red,
    backgroundColor: colors.red,
  },
  reasonLabel: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  reasonLabelSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.ink,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.ink,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.ink2,
  },
});
