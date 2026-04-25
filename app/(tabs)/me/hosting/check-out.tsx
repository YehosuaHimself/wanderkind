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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/stores/auth';

interface CheckOutScreenProps {}

interface GuestDetail {
  name: string;
  checkInDate: string;
  duration: number; // days
}

function StarRating({
  rating,
  onPress,
}: {
  rating: number;
  onPress: (rate: number) => void;
}) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress(star)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={32}
            color={star <= rating ? colors.gold : colors.ink3}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface ConfirmationScreenProps {
  onBack: () => void;
}

function ConfirmationScreen({ onBack }: ConfirmationScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Check-out Confirmed" showBack={false} />

      <ScrollView
        contentContainerStyle={styles.confirmContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.green} />
        </View>

        {/* Success Message */}
        <Text style={[typography.h2, styles.successTitle]}>Guest Checked Out</Text>
        <Text style={[typography.bodySm, styles.successMessage]}>
          Thank you for hosting. This guest's journey continues, and your hospitality has made a difference.
        </Text>

        {/* Info Card */}
        <WKCard variant="gold" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            Your feedback helps maintain the trust and quality of the Wanderkind community.
          </Text>
        </WKCard>

        {/* Return Button */}
        <WKButton
          title="Return to Dashboard"
          onPress={() => router.back()}
          variant="primary"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function CheckOutScreen() {
  const router = useRouter();
  const { booking_id, guest_name, check_in_date, duration } =
    useLocalSearchParams<{
      booking_id?: string;
      guest_name?: string;
      check_in_date?: string;
      duration?: string;
    }>();
  const { user } = useAuth();

  // Mock guest data (in production, would fetch from params/Supabase)
  const guest: GuestDetail = {
    name: guest_name || 'Jean Dupont',
    checkInDate: check_in_date || 'June 15, 2025',
    duration: parseInt(duration || '2'),
  };

  const [gaestebuchNote, setGaestebuchNote] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showGaestebuchPrompt, setShowGaestebuchPrompt] = useState(true);

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      // Update booking status to 'completed'
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          host_rating: rating || null,
          host_notes: gaestebuchNote.trim() || null,
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', booking_id || '')
        .eq('host_id', user?.id || '');

      if (error) throw error;

      // Show confirmation screen
      setConfirmed(true);
    } catch (err) {
      console.error('Check-out error:', err);
      Alert.alert('Error', 'Error processing check-out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return <ConfirmationScreen onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Check Out Guest" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest Card */}
        <WKCard style={{ marginBottom: spacing.xl }}>
          <View style={styles.guestCardContent}>
            <View style={styles.guestHeader}>
              <Ionicons name="person-circle" size={48} color={colors.amber} />
              <View style={styles.guestMeta}>
                <Text style={[typography.h3, styles.guestName]}>{guest.name}</Text>
                <Text style={[typography.bodySm, styles.guestDates]}>
                  {guest.checkInDate} • {guest.duration} nights
                </Text>
              </View>
            </View>
          </View>
        </WKCard>

        {/* Gaestebuch Prompt */}
        {showGaestebuchPrompt && (
          <View style={styles.section}>
            <View style={styles.promptHeader}>
              <Text style={[typography.label, styles.sectionLabel]}>
                Leave a note for {guest.name}?
              </Text>
              <TouchableOpacity
                onPress={() => setShowGaestebuchPrompt(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-outline" size={20} color={colors.ink3} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Share your thoughts about their stay..."
              placeholderTextColor={colors.ink3}
              multiline
              numberOfLines={3}
              value={gaestebuchNote}
              onChangeText={setGaestebuchNote}
              editable={!loading}
            />
          </View>
        )}

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>
            Rate the Experience (Optional)
          </Text>
          <Text style={[typography.bodySm, { color: colors.ink2, marginBottom: spacing.md }]}>
            Your honest feedback helps us maintain quality in the community.
          </Text>
          <StarRating rating={rating} onPress={setRating} />
        </View>

        {/* Info Card */}
        <WKCard style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.bodySm, { color: colors.ink2 }]}>
            This guest's stay is now marked as complete. They will receive a confirmation and can view your feedback.
          </Text>
        </WKCard>

        {/* Confirm Button */}
        <WKButton
          title="Confirm Check-Out"
          onPress={handleCheckOut}
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
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
    color: colors.amber,
  },
  guestCardContent: {
    gap: spacing.md,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guestMeta: {
    flex: 1,
  },
  guestName: {
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  guestDates: {
    color: colors.ink2,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.ink,
  },
  starContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-start',
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
