import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKInput } from '../../../src/components/ui/WKInput';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';
import type { Host, RouteRow } from '../../../src/types/database';

type SearchTab = 'hosts' | 'wanderkinder' | 'routes';
type WandererResult = { id: string; trail_name: string; avatar_url: string | null; tier: string | null; nights_walked: number | null };

const TAB_LABELS: Record<SearchTab, string> = { hosts: 'Hosts', wanderkinder: 'Wanderkinder', routes: 'Routes' };

export default function Search() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('hosts');
  const [searching, setSearching] = useState(false);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [wanderers, setWanderers] = useState<WandererResult[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);

  // Debounced search across all three tables
  useEffect(() => {
    const q = query.trim();
    let cancelled = false;

    const run = async () => {
      if (!q) { setHosts([]); setWanderers([]); setRoutes([]); return; }
      setSearching(true);
      try {
        const [hostsRes, wanderersRes, routesRes] = await Promise.all([
          supabase.from('hosts').select('*').is('source_id', null).or(`name.ilike.%${q}%,address.ilike.%${q}%`).limit(10),
          supabase.from('profiles').select('id,trail_name,avatar_url,tier,nights_walked').ilike('trail_name', `%${q}%`).neq('id', user?.id ?? '').limit(10),
          supabase.from('routes').select('*').or(`name.ilike.%${q}%,country.ilike.%${q}%`).limit(10),
        ]);
        if (cancelled) return;
        setHosts(hostsRes.data as Host[] ?? []);
        setWanderers(wanderersRes.data as WandererResult[] ?? []);
        setRoutes(routesRes.data as RouteRow[] ?? []);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    const timer = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, user]);

  const renderHostResult = useCallback(({ item }: { item: Host }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/(tabs)/map/host/${item.id}`)} activeOpacity={0.7}>
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}><Ionicons name="home" size={20} color={colors.amber} /></View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.address}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  ), [router]);

  const renderWandererResult = useCallback(({ item }: { item: WandererResult }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/(tabs)/me/profile/${item.id}`)} activeOpacity={0.7}>
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}><Ionicons name="person-circle" size={20} color={colors.blue} /></View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.trail_name}</Text>
          <Text style={styles.resultMeta}>{item.tier ? item.tier.toUpperCase() : 'WANDERKIND'}{item.nights_walked ? ` · ${item.nights_walked} nights` : ''}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  ), [router]);

  const renderRouteResult = useCallback(({ item }: { item: RouteRow }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/(tabs)/more/ways/${item.id}`)} activeOpacity={0.7}>
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}><Ionicons name="map" size={20} color={colors.green} /></View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.country}{item.distance_km ? ` · ${item.distance_km} km` : ''}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </TouchableOpacity>
  ), [router]);

  const currentResults = activeTab === 'hosts' ? hosts : activeTab === 'wanderkinder' ? wanderers : routes;
  const currentRenderer = activeTab === 'hosts' ? renderHostResult : activeTab === 'wanderkinder' ? renderWandererResult : renderRouteResult as any;

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Search" />
      <View style={styles.searchContainer}>
        <WKInput
          label=""
          placeholder="Search hosts, wanderers, routes..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <View style={styles.tabs}>
        {(Object.keys(TAB_LABELS) as SearchTab[]).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{TAB_LABELS[tab]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {searching ? (
        <View style={styles.center}><ActivityIndicator size="small" color={colors.amber} /></View>
      ) : !query.trim() ? (
        <WKEmpty icon="search-outline" title="Search Wanderkind" message="Find hosts, wanderers, and routes" iconColor={colors.amberLine} />
      ) : currentResults.length === 0 ? (
        <WKEmpty icon="search-outline" title="No results" message={`No ${TAB_LABELS[activeTab].toLowerCase()} matched "${query}"`} iconColor={colors.amberLine} />
      ) : (
        <FlatList
          data={currentResults as any[]}
          renderItem={currentRenderer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.results}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  tabText: { fontFamily: 'Courier New', fontSize: 10, fontWeight: '600', color: colors.ink2 },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  results: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadows.sm },
  resultContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  resultInfo: { flex: 1 },
  resultName: { ...typography.h3, color: colors.ink },
  resultMeta: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
});
