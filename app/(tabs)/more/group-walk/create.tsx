import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { showAlert } from '../../../../src/lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function CreateGroupWalkScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const router = useRouter();
  const [name, setName] = useState('');
  const [route, setRoute] = useState('');
  const [date, setDate] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name || !route || !date || !maxMembers) {
      showAlert('Missing Information', 'Please fill in all required fields');
      return;
    }
    // Create group walk in backend
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Create Group Walk" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard variant="parchment" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2, lineHeight: 22 }]}>
            Create a group walk to connect with other walkers. Share your route, set a start date, and build community together.
          </Text>
        </WKCard>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.fieldLabel]}>Walk Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Camino del Norte Spring 2024"
            placeholderTextColor={colors.ink3}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.fieldLabel]}>Route (Required)</Text>
          <TouchableOpacity style={styles.routeButton} activeOpacity={0.7}>
            <Ionicons name="trail-sign-outline" size={18} color={colors.amber} />
            <Text style={styles.routeButtonText}>
              {route || 'Select a route...'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.fieldLabel]}>Start Date</Text>
          <TouchableOpacity style={styles.dateButton} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={18} color={colors.amber} />
            <Text style={styles.dateButtonText}>
              {date || 'Pick a date...'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.fieldLabel]}>Max Members</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 12"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            value={maxMembers}
            onChangeText={setMaxMembers}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.fieldLabel]}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Tell other walkers about your group walk..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <WKButton
            title="Create Walk"
            onPress={handleCreate}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  fieldLabel: { marginBottom: spacing.sm, color: colors.amber },
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
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  routeButtonText: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dateButtonText: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
  },
  actions: { marginTop: spacing.xl },
});
