import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
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

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'Easy';
    case 'moderate': return 'Moderate';
    case 'challenging': return 'Hard';
    case 'expert': return 'Expert';
    default: return difficulty;
  }
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#27864A';
    case 'moderate': return '#C8762A';
    case 'challenging': return '#C0392B';
    case 'expert': return '#8E44AD';
    default: return colors.ink3;
  }
};

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

  /** Card background colors — cycling through muted, earthy tones */
  const CARD_COLORS = [
    '#4A5D3A', // olive green
    '#2C3E50', // dark navy
    '#6B5A3E', // earth brown
    '#5B3A29', // warm chestnut
    '#3D5C5C', // forest teal
    '#4A3728', // dark walnut
    '#2D4A3E', // deep moss
    '#5C4033', // saddle brown
  ];

  const renderWay = useCallback(({ item, index }: { item: Route; index: number }) => {
    const bgColor = CARD_COLORS[index % CARD_COLORS.length];

    return (
      <TouchableOpacity
        style={[styles.wayCard, { backgroundColor: bgColor }]}
        onPress={() => { haptic.light(); router.push(`/(tabs)/more/ways/${item.id}`); }}
        activeOpacity={0.85}
      >
        <View style={styles.wayCardContent}>
          <Text style={styles.wayName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.wayCountry} numberOfLines={1}>
            {item.countries.join(', ')}
          </Text>
          <View style={styles.wayCardBottom}>
            <Text style={styles.wayMeta}>
              {item.distance_km.toLocaleString()}km  ·  {item.duration_days} days
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

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
              <Text style={styles.headerLabelText}>DISCOVER</Text>
            </View>
            <Text style={styles.headerTitle}>THE <Text style={{ color: colors.amber }}>WAYS</Text></Text>
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
            <Text style={styles.headerLabelText}>DISCOVER</Text>
          </View>
          <Text style={styles.headerTitle}>THE <Text style={{ color: colors.amber }}>WAYS</Text></Text>
          <Text style={styles.headerSub}>Every path has a story. Find yours.</Text>
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
              onPress={() => { haptic.selection(); setRegionFilter(regionFilter === region ? 'All' : region); }}
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
              onPress={() => { haptic.selection(); setDifficultyFilter(difficultyFilter === diff ? 'All' : diff); }}
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
  headerSub: {
    ...typography.body,
    color: colors.ink2,
    marginTop: 4,
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
    marginHorizontal: spacing.lg,
    marginVertical: 5,
    borderRadius: 14,
    height: 110,
    overflow: 'hidden',
  },
  wayCardContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center' as const,
  },
  wayCardBottom: {
    marginTop: 6,
  },
  wayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  wayCountry: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  wayMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
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
