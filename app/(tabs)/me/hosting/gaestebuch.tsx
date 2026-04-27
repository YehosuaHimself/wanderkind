import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import type { GaestebuchRow } from '../../../src/types/database';

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <View style={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={colors.gold} />
      ))}
    </View>
  );
}

function GuestbookEntry({ entry }: { entry: GaestebuchRow }) {
  const date = new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <WKCard style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryMeta}>
          <Text style={styles.walkerName}>{entry.walker_name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <StarRating rating={entry.rating} />
      </View>
      <Text style={styles.message}>{entry.message}</Text>
    </WKCard>
  );
}

export default function GaestebuchScreen() {
  const { user, isLoading } = useAuthGuard();
  const [entries, setEntries] = useState<GaestebuchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('gaestebuch')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });
      setEntries(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const avgRating = entries.length
    ? (entries.reduce((sum, e) => sum + (e.rating ?? 0), 0) / entries.filter(e => e.rating).length) || 0
    : 0;

  const onRefresh = () => { setRefreshing(true); fetchEntries(); };

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Gästebuch" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Gästebuch" showBack />
      {entries.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>avg rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>entries</Text>
          </View>
        </View>
      )}
      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        renderItem={({ item }) => <GuestbookEntry entry={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
        ListEmptyComponent={
          <WKEmpty icon="book-outline" title="No entries yet" message="Your guests' messages will appear here after their stay" iconColor={colors.amberLine} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsBar: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { ...typography.h2, color: colors.amber },
  statLabel: { ...typography.label, color: colors.ink3, marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.md },
  entryCard: { marginBottom: 0 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  entryMeta: { flex: 1 },
  walkerName: { ...typography.h3, color: colors.ink },
  date: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  message: { ...typography.body, color: colors.ink2, lineHeight: 22 },
});
