import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Route } from '../../../src/types/database';
import { SEED_ROUTES } from '../../../src/data/seed-routes';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function WaysList() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [ways, setWays] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWays();
  }, []);

  const fetchWays = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('walker_count', { ascending: false });

      if (!error && data && data.length > 0) {
        setWays(data as Route[]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch ways:', err);
    }

    // Fallback to seed data if Supabase returns empty or fails
    setWays(SEED_ROUTES as unknown as Route[]);
    setLoading(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.green;
      case 'moderate':
        return colors.amber;
      case 'challenging':
        return colors.red;
      default:
        return colors.ink3;
    }
  };

  const renderWay = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.wayCard}
      onPress={() => router.push(`/(tabs)/more/ways/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Hero Image */}
      {item.hero_image && (
        <Image source={{ uri: item.hero_image }} style={styles.heroImage} resizeMode="cover" />
      )}

      {/* Content */}
      <View style={styles.wayContent}>
        <View style={styles.wayHeader}>
          <View>
            <Text style={styles.wayName}>{item.name}</Text>
            <Text style={styles.wayCountries}>{item.countries.join(' · ')}</Text>
          </View>
          <View style={styles.difficultyBadge}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={12} color={colors.ink3} />
            <Text style={styles.statText}>{item.distance_km} km</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="calendar-outline" size={12} color={colors.ink3} />
            <Text style={styles.statText}>{item.duration_days} days</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="home-outline" size={12} color={colors.ink3} />
            <Text style={styles.statText}>{item.host_count} hosts</Text>
          </View>
        </View>

        {/* Free Hosts Badge */}
        {item.free_host_count > 0 && (
          <View style={styles.freeHostBadge}>
            <Ionicons name="leaf" size={12} color={colors.green} />
            <Text style={styles.freeHostText}>{item.free_host_count} free options</Text>
          </View>
        )}

        {/* Walker Count */}
        <Text style={styles.walkerCount}>{item.walker_count} wanderkinder walked this way</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>No ways yet</Text>
      <Text style={styles.emptyText}>Check back soon for pilgrimage routes.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLabelText}>WAYS</Text>
          </View>
          <Text style={styles.headerTitle}>Pilgrimage Routes</Text>
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>WAYS</Text>
        </View>
        <Text style={styles.headerTitle}>Pilgrimage Routes</Text>
      </View>

      <FlatList
        data={ways}
        renderItem={renderWay}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  headerLabelText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },
  wayCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
    ...shadows.sm,
  },
  heroImage: { width: '100%', height: 160, backgroundColor: colors.surfaceAlt },
  wayContent: { padding: spacing.lg },
  wayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  wayName: { ...typography.h3, color: colors.ink, marginBottom: 2 },
  wayCountries: { ...typography.bodySm, color: colors.ink3 },
  difficultyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: { fontWeight: '700', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.bodySm, color: colors.ink3, fontWeight: '500' },
  freeHostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  freeHostText: { fontSize: 11, fontWeight: '600', color: colors.green },
  walkerCount: { ...typography.caption, color: colors.ink3, fontStyle: 'italic' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, marginTop: 6, textAlign: 'center' },
});
