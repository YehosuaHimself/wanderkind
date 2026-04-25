import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const MOCK_ENTRIES = [
  {
    id: '1',
    name: 'Jean Dupont',
    date: 'May 15, 2024',
    message: 'Beautiful house and wonderful host. The garden was perfect for evening reflection.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Maria García',
    date: 'April 28, 2024',
    message: 'A true sanctuary. Thank you for the warm welcome and delicious breakfast!',
    rating: 5,
  },
  {
    id: '3',
    name: 'Klaus Mueller',
    date: 'April 10, 2024',
    message: 'Very clean and comfortable. Would definitely stay again.',
    rating: 4,
  },
  {
    id: '4',
    name: 'Sofia Rossi',
    date: 'March 22, 2024',
    message: 'Lovely hosts. The kitchen facilities are great for pilgrims.',
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? colors.gold : colors.ink3}
        />
      ))}
    </View>
  );
}

function GuestbookEntry({ entry }: { entry: typeof MOCK_ENTRIES[0] }) {
  return (
    <WKCard style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={40} color={colors.amber} />
          </View>
          <View style={styles.entryInfo}>
            <Text style={styles.guestName}>{entry.name}</Text>
            <Text style={styles.entryDate}>{entry.date}</Text>
          </View>
        </View>
        <StarRating rating={entry.rating} />
      </View>
      <Text style={styles.entryMessage}>{entry.message}</Text>
    </WKCard>
  );
}

export default function GaestebuchScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const averageRating =
    MOCK_ENTRIES.reduce((sum, e) => sum + e.rating, 0) / MOCK_ENTRIES.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Guest Book" showBack={true} />

      <View style={styles.content}>
        {/* Stats Card */}
        {MOCK_ENTRIES.length > 0 && (
          <WKCard variant="gold" style={styles.statsCard}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Guests</Text>
                <Text style={styles.statValue}>{MOCK_ENTRIES.length}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average Rating</Text>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.ratingValue}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <Ionicons name="star" size={18} color={colors.gold} />
                </View>
              </View>
            </View>
          </WKCard>
        )}

        {/* Guest Entries */}
        {MOCK_ENTRIES.length > 0 ? (
          <FlatList
            data={MOCK_ENTRIES}
            renderItem={({ item }) => <GuestbookEntry entry={item} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <WKEmpty
            icon="book"
            title="No Entries Yet"
            message="Your guest book will fill up as walkers stay with you"
          />
        )}
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
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  statValue: {
    ...typography.h2,
    color: colors.ink,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingValue: {
    ...typography.h2,
    color: colors.ink,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  entryCard: {
    gap: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  guestName: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  entryDate: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  entryMessage: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
});
