import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKInput } from '../../../src/components/ui/WKInput';

export default function BookingReview() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [gaestebuch, setGaestebuch] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    router.push('/booking/history');
  };

  const StarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starBtn}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? colors.gold : colors.ink3}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Leave a Review" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Host Info */}
          <WKCard variant="parchment">
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Ionicons name="person-circle" size={48} color={colors.amber} />
              </View>
              <View>
                <Text style={styles.hostName}>Maria Gonzalez</Text>
                <Text style={styles.stayDates}>May 15 - 18, 2024</Text>
              </View>
            </View>
          </WKCard>

          {/* Rating */}
          <WKCard>
            <Text style={styles.sectionLabel}>How was your stay?</Text>
            <StarRating />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
              </Text>
            )}
          </WKCard>

          {/* Review Text */}
          <WKCard>
            <Text style={styles.sectionLabel}>Your Review</Text>
            <Text style={styles.hint}>
              Share your experience to help other wanderers
            </Text>
            <WKInput
              placeholder="Tell others about your stay..."
              multiline
              numberOfLines={5}
              value={review}
              onChangeText={setReview}
              style={styles.reviewInput}
            />
          </WKCard>

          {/* Gaestebuch Option */}
          <WKCard>
            <View style={styles.gaestebuchRow}>
              <View style={styles.gaestebuchText}>
                <Text style={styles.gaestebuchTitle}>Add to Gaestebuch</Text>
                <Text style={styles.gaestebuchHint}>
                  Leave a message in the host's guestbook
                </Text>
              </View>
              <Switch
                value={gaestebuch}
                onValueChange={setGaestebuch}
                trackColor={{ false: colors.border, true: colors.gold }}
                thumbColor={gaestebuch ? colors.amber : colors.ink3}
              />
            </View>
          </WKCard>

          {/* Gaestebuch Message */}
          {gaestebuch && (
            <WKCard variant="gold">
              <Text style={styles.sectionLabel}>Gaestebuch Entry</Text>
              <Text style={styles.hint}>
                A special message for the host's guestbook
              </Text>
              <WKInput
                placeholder="Write a message for the guestbook..."
                multiline
                numberOfLines={4}
                style={styles.reviewInput}
              />
            </WKCard>
          )}

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={colors.ink2} />
            <Text style={styles.infoText}>
              Your review will be published on the host's profile and help the Wanderkind community.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <WKButton
          title={loading ? 'Submitting...' : 'Submit Review'}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          loading={loading}
          fullWidth
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screenPx,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  stayDates: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  sectionLabel: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.md,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  starBtn: {
    padding: spacing.xs,
  },
  ratingLabel: {
    ...typography.body,
    color: colors.amber,
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewInput: {
    minHeight: 100,
    paddingVertical: spacing.md,
  },
  gaestebuchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaestebuchText: {
    flex: 1,
  },
  gaestebuchTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  gaestebuchHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.parchment,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink,
    flex: 1,
    lineHeight: 19,
  },
});
