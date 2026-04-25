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
import { supabase } from '../../../src/lib/supabase';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import type { Route } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function Routes() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      setRoutes(data as Route[] || []);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    if (difficulty === 'easy') return colors.green;
    if (difficulty === 'moderate') return colors.amber;
    return colors.red;
  };

  const renderRouteCard = ({ item: route }: { item: Route }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/map/route/${route.id}`)}
        activeOpacity={0.7}
      >
        {route.hero_image && (
          <Image source={{ uri: route.hero_image }} style={styles.cardImage} />
        )}

        <View style={styles.cardOverlay}>
          <View style={styles.header}>
            <Text style={styles.routeName} numberOfLines={2}>{route.name}</Text>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyBadgeColor(route.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{route.difficulty.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.countries}>
            {route.countries.map((country, i) => (
              <View key={i} style={styles.countryTag}>
                <Text style={styles.countryText}>{country}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerStat}>
            <Ionicons name="trail-sign" size={14} color={colors.amber} />
            <Text style={styles.footerStatText}>{route.distance_km} km</Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerStat}>
            <Ionicons name="bed-outline" size={14} color={colors.ink2} />
            <Text style={styles.footerStatText}>{route.host_count} hosts</Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerStat}>
            <Ionicons name="people-outline" size={14} color={colors.ink2} />
            <Text style={styles.footerStatText}>{route.walker_count} walkers</Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.ink3} style={styles.footerChevron} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="European Ways" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      ) : routes.length === 0 ? (
        <WKEmpty
          icon="map-outline"
          title="No Routes Found"
          message="Check back soon for more ways to walk"
        />
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRouteCard}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.listContent}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.lg,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceAlt,
  },
  cardOverlay: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  routeName: {
    flex: 1,
    ...typography.h3,
    color: colors.ink,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  difficultyText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  countries: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  countryTag: {
    backgroundColor: colors.parchment,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  countryText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.parchmentInk,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    gap: spacing.md,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerStatText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderLt,
  },
  footerChevron: {
    marginLeft: 'auto',
  },
});
