import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { Route, Host } from '../../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function WayDetail() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [way, setWay] = useState<Route | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWayDetail();
  }, [id]);

  const fetchWayDetail = async () => {
    try {
      const { data: wayData } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (wayData) setWay(wayData as Route);

      // Fetch hosts on this route
      const { data: hostsData } = await supabase
        .from('hosts')
        .select('*')
        .eq('route_id', id)
        .limit(10);

      if (hostsData) setHosts(hostsData as Host[]);
    } catch (err) {
      console.error('Failed to fetch way:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: 'Easy walking',
      moderate: 'Moderate challenge',
      challenging: 'Challenging terrain',
      expert: 'Expert — multi-week expedition',
    };
    return labels[difficulty] || difficulty;
  };

  const handleBegin = () => {
    // Navigate to booking or way introduction flow
    router.push({
      pathname: '/(tabs)/more/ways/[id]',
      params: { id, action: 'begin' },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!way) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={typography.bodySm}>Way not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero Image */}
        {way.hero_image && (
          <Image source={{ uri: way.hero_image }} style={styles.heroImage} resizeMode="cover" />
        )}

        {/* Way Title & Info */}
        <View style={styles.titleSection}>
          <Text style={styles.wayTitle}>{way.name}</Text>
          <Text style={styles.wayCountries}>{way.countries.join(' · ').toUpperCase()}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBlock}>
              <Ionicons name="location-outline" size={18} color={colors.amber} />
              <Text style={styles.statValue}>{way.distance_km}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statBlock}>
              <Ionicons name="calendar-outline" size={18} color={colors.amber} />
              <Text style={styles.statValue}>{way.duration_days}</Text>
              <Text style={styles.statLabel}>days</Text>
            </View>
            <View style={styles.statBlock}>
              <Ionicons name="home-outline" size={18} color={colors.amber} />
              <Text style={styles.statValue}>{way.host_count}</Text>
              <Text style={styles.statLabel}>hosts</Text>
            </View>
            <View style={styles.statBlock}>
              <Ionicons name="person-outline" size={18} color={colors.amber} />
              <Text style={styles.statValue}>{way.walker_count}</Text>
              <Text style={styles.statLabel}>walkers</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Way</Text>
          <Text style={styles.description}>{way.description}</Text>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.difficultyBox}>
            <Text style={styles.difficultyLabel}>{getDifficultyLabel(way.difficulty)}</Text>
          </View>
        </View>

        {/* Hosts Along the Way */}
        {hosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosts Along the Way</Text>
            {hosts.slice(0, 3).map(host => (
              <View key={host.id} style={styles.hostCard}>
                <View style={styles.hostContent}>
                  <Text style={styles.hostName}>{host.name}</Text>
                  <View style={styles.hostMeta}>
                    {host.is_available && (
                      <View style={styles.availableBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.green} />
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                    <Text style={styles.hostType}>{host.host_type?.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
            {hosts.length > 3 && (
              <Text style={styles.moreHosts}>+{hosts.length - 3} more hosts</Text>
            )}
          </View>
        )}

        {/* Free Hosts Info */}
        {way.free_host_count > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="leaf" size={18} color={colors.green} />
            <Text style={styles.infoText}>
              {way.free_host_count} free or donativo accommodations available
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Begin Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.beginBtn} onPress={handleBegin}>
          <Ionicons name="play" size={18} color={colors.surface} />
          <Text style={styles.beginBtnText}>Begin This Way</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  headerSpacer: { width: 28 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: spacing.xl },
  heroImage: { width: '100%', height: 240, backgroundColor: colors.surfaceAlt },
  titleSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  wayTitle: { ...typography.h1, color: colors.ink, marginBottom: 4 },
  wayCountries: { fontSize: 12, letterSpacing: 2, color: colors.amber, fontWeight: '700', marginBottom: spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBlock: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
  },
  statValue: { ...typography.h3, color: colors.amber, marginTop: 4 },
  statLabel: { ...typography.caption, color: colors.ink3, marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.lg },
  description: { ...typography.body, color: colors.ink, lineHeight: 24 },
  difficultyBox: {
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  difficultyLabel: { ...typography.bodySm, color: colors.amber, fontWeight: '600' },
  hostCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  hostContent: { flex: 1 },
  hostName: { ...typography.bodySm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  hostMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  availableText: { fontSize: 10, color: colors.green, fontWeight: '500' },
  hostType: { fontSize: 10, letterSpacing: 1.5, color: colors.amber, fontWeight: '600' },
  moreHosts: { ...typography.bodySm, color: colors.ink3, marginTop: spacing.md },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.greenBg,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  infoText: { ...typography.bodySm, color: colors.green, flex: 1, lineHeight: 20 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  beginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  beginBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
