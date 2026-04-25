import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKInput } from '../../../src/components/ui/WKInput';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type SearchTab = 'hosts' | 'wanderkinder' | 'routes';

const MOCK_HOSTS = [
  { id: '1', name: 'Casa Verde', type: 'free', address: 'Burgos, Spain' },
  { id: '2', name: 'Maison Blanche', type: 'donativo', address: 'Roncevaux, France' },
];

const MOCK_WANDERERS = [
  { id: '1', name: 'Sarah Walker', tier: 'wandersmann', nights: 45 },
  { id: '2', name: 'Marco', tier: 'apostel', nights: 180 },
];

const MOCK_ROUTES = [
  { id: '1', name: 'Camino Francés', distance: 780, country: 'Spain' },
  { id: '2', name: 'Camino del Norte', distance: 656, country: 'Spain' },
];

export default function Search() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('hosts');

  const filteredHosts = useMemo(() => {
    if (!query) return MOCK_HOSTS;
    return MOCK_HOSTS.filter(h =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.address.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const filteredWanderers = useMemo(() => {
    if (!query) return MOCK_WANDERERS;
    return MOCK_WANDERERS.filter(w =>
      w.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const filteredRoutes = useMemo(() => {
    if (!query) return MOCK_ROUTES;
    return MOCK_ROUTES.filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.country.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const renderHostResult = ({ item }: { item: typeof MOCK_HOSTS[0] }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(tabs)/map/host/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}>
          <Ionicons name="home" size={20} color={colors.amber} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.address}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  );

  const renderWandererResult = ({ item }: { item: typeof MOCK_WANDERERS[0] }) => (
    <TouchableOpacity style={styles.resultCard} activeOpacity={0.7}>
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}>
          <Ionicons name="person-circle" size={20} color={colors.blue} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.tier.toUpperCase()} · {item.nights} nights</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  );

  const renderRouteResult = ({ item }: { item: typeof MOCK_ROUTES[0] }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(tabs)/map/route/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}>
          <Ionicons name="map" size={20} color={colors.green} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.distance} km · {item.country}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  );

  const currentResults =
    activeTab === 'hosts' ? filteredHosts :
    activeTab === 'wanderkinder' ? filteredWanderers :
    filteredRoutes;

  const hasResults = currentResults.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Search" />

      <View style={styles.searchContainer}>
        <WKInput
          label=""
          placeholder="Search hosts, wanderers, routes..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        {(['hosts', 'wanderkinder', 'routes'] as SearchTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'hosts' ? 'Hosts' : tab === 'wanderkinder' ? 'Wanderers' : 'Routes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {!hasResults && query ? (
        <WKEmpty
          icon="search-outline"
          title="No Results"
          message={`No ${activeTab} found matching "${query}"`}
        />
      ) : !query ? (
        <WKEmpty
          icon="search-outline"
          title="Start Searching"
          message="Find hosts, wanderers, and routes on the way"
        />
      ) : (
        <FlatList
          data={currentResults}
          renderItem={
            activeTab === 'hosts' ? renderHostResult :
            activeTab === 'wanderkinder' ? renderWandererResult :
            renderRouteResult
          }
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  searchInput: {
    marginBottom: 0,
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.amber,
  },
  tabText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  resultsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  resultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  resultMeta: {
    ...typography.bodySm,
    color: colors.ink2,
  },
});
