import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';

const stampCategories = [
  { id: 'hospitality', label: 'Hospitality', icon: 'home-outline' as const },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' as const },
  { id: 'culture', label: 'Culture', icon: 'library-outline' as const },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' as const },
  { id: 'community', label: 'Community', icon: 'people-outline' as const },
  { id: 'water', label: 'Water', icon: 'water-outline' as const },
  { id: 'adventure', label: 'Adventure', icon: 'flash-outline' as const },
  { id: 'workshops', label: 'Workshops', icon: 'school-outline' as const },
];

interface SuccessScreenProps {
  onBack: () => void;
}

function SuccessScreen({ onBack }: SuccessScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Stamp Given" showBack={false} />

      <ScrollView
        contentContainerStyle={styles.successContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.gold} />
        </View>

        {/* Message */}
        <Text style={[typography.h2, styles.successTitle]}>Stamp Given!</Text>
        <Text style={[typography.bodySm, styles.successMessage]}>
          The walker has received your stamp and will treasure this memory of your hospitality.
        </Text>

        {/* Info Card */}
        <WKCard variant="gold" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            Stamps are the heart of the Wanderkind journey—each one represents a genuine connection between hosts and walkers.
          </Text>
        </WKCard>

        {/* Return Button */}
        <WKButton
          title="Return Home"
          onPress={onBack}
          variant="primary"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function GiveStampScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [scanMethod, setScanMethod] = useState<'qr' | 'trail' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [trailName, setTrailName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a stamp category');
      return;
    }

    setLoading(true);
    try {
      // Create stamp record in Supabase
      const { error } = await supabase
        .from('stamps')
        .insert({
          host_id: user?.id,
          walker_id: '', // set by the receiving walker
          host_name: profile?.trail_name || 'Host',
          category: selectedCategory,
          note: note.trim() || null,
          trail_name: trailName.trim() || null,
          night_number: 0,
          reflection: null,
          reflection_public: false,
          verification_hash: '',
          previous_hash: null,
          photo_url: null,
          route_id: null,
          route_km: null,
          created_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      // Show success screen
      setSuccess(true);
    } catch (err) {
      console.error('Stamp creation error:', err);
      Alert.alert('Error', 'Error creating stamp. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <SuccessScreen onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Give Stamp" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <WKCard style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            Give a stamp to commemorate this walker's stay. Choose a category that best reflects your shared experience.
          </Text>
        </WKCard>

        {/* Scan Method Selection */}
        {!scanMethod && (
          <View style={styles.section}>
            <Text style={[typography.label, styles.sectionLabel]}>How to identify the walker?</Text>
            <View style={styles.methodGrid}>
              <TouchableOpacity
                style={styles.methodButton}
                onPress={() => setScanMethod('qr')}
              >
                <Ionicons name="qr-code-outline" size={24} color={colors.amber} />
                <Text style={styles.methodLabel}>Scan QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.methodButton}
                onPress={() => setScanMethod('trail')}
              >
                <Ionicons name="text-outline" size={24} color={colors.amber} />
                <Text style={styles.methodLabel}>Enter Trail Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trail Name Input (if selected) */}
        {scanMethod === 'trail' && (
          <View style={styles.section}>
            <Text style={[typography.label, styles.sectionLabel]}>Walker's Trail Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Their trail name..."
              placeholderTextColor={colors.ink3}
              value={trailName}
              onChangeText={setTrailName}
              editable={!loading}
            />
          </View>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Stamp Category</Text>
          <View style={styles.categoryGrid}>
            {stampCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedCategory === cat.id }}
              >
                <Ionicons
                  name={cat.icon}
                  size={24}
                  color={selectedCategory === cat.id ? colors.amber : colors.ink3}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional Note */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Share a memory or message..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
            editable={!loading}
          />
        </View>

        {/* Confirm Button */}
        <WKButton
          title="Confirm & Give Stamp"
          onPress={handleConfirm}
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!selectedCategory || (!scanMethod || (scanMethod === 'trail' && !trailName.trim())) || loading}
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
  successContent: {
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
    marginBottom: spacing.md,
    color: colors.amber,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  methodLabel: {
    ...typography.bodySm,
    color: colors.ink,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryButton: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    minHeight: 80,
    justifyContent: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: colors.amber,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
    ...typography.body,
    color: colors.ink,
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
