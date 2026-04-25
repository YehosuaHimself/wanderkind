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
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const reportOptions = [
  { id: 'closed', label: 'Closed permanently' },
  { id: 'phone', label: 'Wrong phone number' },
  { id: 'ownership', label: 'Changed ownership' },
  { id: 'stayed', label: 'Still open — I stayed here!' },
];

export default function ReportIssueScreen() {
  useAuthGuard();

  const router = useRouter();
  const { host_id } = useLocalSearchParams<{ host_id: string }>();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption) {
      showAlert('Missing Information', 'Please select an issue type');
      return;
    }

    setLoading(true);
    try {
      // Insert report into Supabase
      const { error } = await supabase
        .from('host_reports')
        .insert({
          host_id: host_id || null,
          reporter_id: user?.id || null,
          report_type: selectedOption,
          note: note.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Show success and go back
      showAlert('Success', 'Thank you for reporting. We will investigate this.');
      router.back();
    } catch (err) {
      console.error('Report submission error:', err);
      showAlert('Error', 'Error submitting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Report Issue" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            Help us keep the Wanderkind community informed by reporting hosting changes in the community.
          </Text>
        </WKCard>

        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>What's the issue?</Text>
          <View style={styles.optionsList}>
            {reportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedOption(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedOption === option.id }}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedOption === option.id && styles.radioCircleSelected,
                  ]}
                >
                  {selectedOption === option.id && (
                    <Ionicons name="checkmark" size={14} color={colors.surface} />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    selectedOption === option.id && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional Note */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Details (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add any additional details..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
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
          disabled={!selectedOption || loading}
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    color: colors.red,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionButton: {
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
  optionButtonSelected: {
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
  optionLabel: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.ink,
  },
});
