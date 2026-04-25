import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { showAlert } from '../../../src/lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const categories = [
  { id: 'bug', label: 'Bug Report', icon: 'warning-outline' as const },
  { id: 'feature', label: 'Feature Request', icon: 'lightbulb-outline' as const },
  { id: 'feedback', label: 'General Feedback', icon: 'chatbubble-outline' as const },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const },
];

export default function FeedbackScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [category, setCategory] = useState('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) {
      showAlert('Missing Information', 'Please enter your feedback');
      return;
    }
    // Submit feedback to backend
    showAlert('Success', 'Thank you for your feedback!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Send Feedback" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard variant="gold" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2, lineHeight: 22 }]}>
            Help us improve Wanderkind by sharing your thoughts, ideas, or reporting issues.
          </Text>
        </WKCard>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Feedback Type</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonSelected,
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={category === cat.id ? colors.amber : colors.ink3}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Your Message</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Tell us what you think..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            maxLength={2000}
          />
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="So we can follow up with you"
            placeholderTextColor={colors.ink3}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Action Buttons */}
        <WKButton
          title="Send Feedback"
          onPress={handleSubmit}
          variant="primary"
          fullWidth
        />
        <WKButton
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, color: colors.amber },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  categoryButtonSelected: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  categoryLabel: { ...typography.caption, color: colors.ink3, marginTop: spacing.sm, textAlign: 'center' },
  categoryLabelSelected: { color: colors.amber, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.ink,
  },
  textarea: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 140,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.ink,
  },
});
