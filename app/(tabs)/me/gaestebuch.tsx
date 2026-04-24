import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

interface GaestebuchEntry {
  id: string;
  guest_name: string;
  guest_avatar?: string;
  message: string;
  rating: number;
  date: string;
  location: string;
}

export default function GaestebuchScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GaestebuchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [user?.id]);

  const fetchEntries = async () => {
    try {
      if (!user) return;
      const { data } = await supabase
        .from('gaestebuch_entries')
        .select('*')
        .eq('host_id', user.id)
        .order('date', { ascending: false });

      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEntry = ({ item }: { item: GaestebuchEntry }) => (
    <WKCard style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.guestInfo}>
          {item.guest_avatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.guest_name[0]}</Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.ink3} />
            </View>
          )}
          <View style={styles.guestText}>
            <Text style={styles.guestName}>{item.guest_name}</Text>
            <Text style={styles.entryDate}>{item.date}</Text>
          </View>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={colors.gold} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      {item.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.ink3} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}

      <Text style={styles.message}>{item.message}</Text>
    </WKCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Gaestebuch" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Gaestebuch" showBack />

      {entries.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.emptyContent}>
          <View style={styles.emptyContainer}>
            <Ionicons name="book" size={48} color={colors.ink3} />
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Entries from guests will appear here
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          style={styles.list}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.ink3,
  },
  emptyContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  entryCard: {
    marginBottom: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  guestInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.phone,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.bodySm,
    color: colors.surface,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: radii.phone,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestText: {
    flex: 1,
  },
  guestName: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  entryDate: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.goldBg,
    borderRadius: radii.full,
  },
  ratingText: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.caption,
    color: colors.ink3,
  },
  message: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
});
