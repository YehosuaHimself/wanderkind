import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Route } from '../../../src/types/database';
import { SEED_ROUTES } from '../../../src/data/seed-routes';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

/** Derive region from a route's countries list */
const REGION_MAP: Record<string, string> = {
  'Spain': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Germany': 'Europe',
  'Portugal': 'Europe', 'Switzerland': 'Europe', 'Austria': 'Europe', 'England': 'Europe',
  'Scotland': 'Europe', 'Ireland': 'Europe', 'UK': 'Europe', 'Norway': 'Europe',
  'Sweden': 'Europe', 'Finland': 'Europe', 'Iceland': 'Europe', 'Netherlands': 'Europe',
  'Czech Republic': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Serbia': 'Europe',
  'Bulgaria': 'Europe', 'Hungary': 'Europe', 'Slovakia': 'Europe', 'Slovenia': 'Europe',
  'Croatia': 'Europe', 'Bosnia and Herzegovina': 'Europe', 'Montenegro': 'Europe',
  'Albania': 'Europe', 'Kosovo': 'Europe', 'North Macedonia': 'Europe', 'Greece': 'Europe',
  'Cyprus': 'Europe', 'Monaco': 'Europe', 'Lithuania': 'Europe', 'Latvia': 'Europe',
  'Estonia': 'Europe', 'Bosnia': 'Europe',
  'United States': 'Americas', 'Peru': 'Americas', 'Chile': 'Americas', 'Guatemala': 'Americas',
  'Japan': 'Asia', 'Nepal': 'Asia', 'China': 'Asia',
  'Turkey': 'Middle East', 'Jordan': 'Middle East', 'Palestine': 'Middle East',
  'Tanzania': 'Africa', 'Namibia': 'Africa', 'Morocco': 'Africa',
  'New Zealand': 'Oceania', 'Australia': 'Oceania',
  'Russia': 'Europe', 'Belarus': 'Europe', 'Ukraine': 'Europe',
};

function getRegion(countries: string[]): string {
  for (const c of countries) {
    const region = REGION_MAP[c];
    if (region) return region;
  }
  return 'Other';
}

const REGIONS = ['All', 'Europe', 'Americas', 'Asia', 'Africa', 'Middle East', 'Oceania'] as const;
const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Challenging', 'Expert'] as const;

export default function WaysList({ embedded = false }: { embedded?: boolean }) {
  const { user, isLoading } = useAuthGuard();
  // Don't block rendering when embedded — parent handles auth
  if (isLoading && !embedded) return null;

  const router = useRouter();
  const [ways, setWays] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

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

  /** Filtered + searched routes */
  const filteredWays = useMemo(() => {
    let result = ways;

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.countries.some(c => c.toLowerCase().includes(q)) ||
        w.country.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
      );
    }

    // Region filter
    if (regionFilter !== 'All') {
      result = result.filter(w => getRegion(w.countries) === regionFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'All') {
      result = result.filter(w => w.difficulty === difficultyFilter.toLowerCase());
    }

    return result;
  }, [ways, search, regionFilter, difficultyFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.green;
      case 'moderate': return colors.amber;
      case 'challenging': return colors.red;
      case 'expert': return '#8B5CF6';
      default: return colors.ink3;
    }
  };

  const renderWay = useCallback(({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.wayCard}
      onPress={() => router.push(`/(tabs)/more/ways/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Hero Image */}
      {item.hero_image && (
        <Image source={{ uri: item.hero_image }} style={styles.heroImage} resizeMode="cover" />
      )}

      {/* Region badge on image */}
      <View style={styles.regionOverlay}>
        <Text style={styles.regionOverlayText}>{getRegion(item.countries)}</Text>
      </View>

      {/* Content */}
      <View style={styles.wayContent}>
        <View style={styles.wayHeader}>
          <View style={styles.wayHeaderLeft}>
            <Text style={styles.wayName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.wayCountries} numberOfLines={1}>{item.countries.join(' · ')}</Text>
          </View>
          <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(item.difficulty) + '40' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={12} color={colors.ink3} />
            <Text style={styles.statText}>{item.distance_km.toLocaleString()} km</Text>
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
        <Text style={styles.walkerCount}>
          {item.walker_count.toLocaleString()} wanderkinder walked this way
        </Text>
      </View>
    </TouchableOpacity>
  ), [router]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>
        {search || regionFilter !== 'All' || difficultyFilter !== 'All'
          ? 'No matching ways'
          : 'No ways yet'}
      </Text>
      <Text style={styles.emptyText}>
        {search || regionFilter !== 'All' || difficultyFilter !== 'All'
          ? 'Try adjusting your filters or search terms.'
          : 'Check back soon for walking routes.'}
      </Text>
    </View>
  );

  const activeFilterCount =
    (regionFilter !== 'All' ? 1 : 0) +
    (difficultyFilter !== 'All' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const Wrapper = embedded ? View : SafeAreaView;
  const wrapperProps = embedded ? { style: styles.container } : { style: styles.container, edges: ['top'] as const };

  if (loading) {
    return (
      <Wrapper {...(wrapperProps as any)}>
        {!embedded && (
          <View style={styles.header}>
            <View style={styles.headerLabel}>
              <View style={styles.headerDot} />
              <Text style={styles.headerLabelText}>WAYS</Text>
            </View>
            <Text style={styles.headerTitle}>Walking Routes</Text>
          </View>
        )}
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...(wrapperProps as any)}>
      {!embedded && (
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLabelText}>WAYS</Text>
          </View>
          <Text style={styles.headerTitle}>Walking Routes</Text>
          <Text style={styles.headerCount}>
            {filteredWays.length} route{filteredWays.length !== 1 ? 's' : ''} worldwide
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.ink3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes, countries..."
            placeholderTextColor={colors.ink3}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.ink3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Region Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {REGIONS.map(region => (
            <TouchableOpacity
              key={region}
              style={[styles.chip, regionFilter === region && styles.chipActive]}
              onPress={() => setRegionFilter(regionFilter === region ? 'All' : region)}
            >
              <Text style={[styles.chipText, regionFilter === region && styles.chipTextActive]}>
                {region === 'All' ? 'All Regions' : region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Difficulty Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DIFFICULTIES.map(diff => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.chip,
                difficultyFilter === diff && styles.chipActive,
                diff !== 'All' && { borderLeftWidth: 3, borderLeftColor: getDifficultyColor(diff.toLowerCase()) },
              ]}
              onPress={() => setDifficultyFilter(difficultyFilter === diff ? 'All' : diff)}
            >
              <Text style={[styles.chipText, difficultyFilter === diff && styles.chipTextActive]}>
                {diff === 'All' ? 'Any Difficulty' : diff}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <TouchableOpacity
          style={styles.clearFilters}
          onPress={() => { setSearch(''); setRegionFilter('All'); setDifficultyFilter('All'); }}
        >
          <Ionicons name="close" size={14} color={colors.amber} />
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredWays}
        renderItem={renderWay}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 12,
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
  headerCount: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: 2,
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },

  // Filters
  filterSection: {
    paddingTop: 6,
    gap: 4,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: 6,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  chipActive: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink3,
  },
  chipTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginLeft: spacing.lg,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.amber,
  },

  // Route list
  list: { paddingVertical: 6 },
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
  regionOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  regionOverlayText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  wayContent: { padding: spacing.lg },
  wayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: 8,
  },
  wayHeaderLeft: { flex: 1 },
  wayName: { ...typography.h3, color: colors.ink, marginBottom: 2 },
  wayCountries: { ...typography.bodySm, color: colors.ink3 },
  difficultyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLt,
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
  walkerCount: { ...typography.caption, color: colors.ink3 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 60,
  },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, marginTop: 6, textAlign: 'center' },
});
