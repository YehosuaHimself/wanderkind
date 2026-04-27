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
import type { Profile } from '../../../src/types/database';
import { SEED_PROFILES } from '../../../src/data/seed-profiles';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

interface NearbyWanderer extends Profile {
  distance_km?: number;
  last_seen?: string;
}

export default function Wanderkinder() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [wanderers, setWanderers] = useState<NearbyWanderer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyWanderers();
    const interval = setInterval(fetchNearbyWanderers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNearbyWanderers = async () => {
    try {
      const { data } = await supabase
        .from('presence')
        .select('profile_id, lat, lng, updated_at')
        .not('profile_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        const profileIds = (data as any[]).map(p => p.profile_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds)
          .eq('is_walking', true);

        if (profiles && profiles.length > 0) {
          setWanderers(profiles as NearbyWanderer[] || []);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch nearby wanderers:', err);
    }

    // Fallback: surface seed walkers so the screen never feels empty.
    // Sorted by approximate distance to user when we have a location.
    const seeds = (SEED_PROFILES as unknown as NearbyWanderer[]).filter(p => p.is_walking);
    let userLat: number | null = null;
    let userLng: number | null = null;
    try {
      const nav: any = (globalThis as any)?.navigator;
      if (nav?.geolocation?.getCurrentPosition) {
        await new Promise<void>(resolve => {
          nav.geolocation.getCurrentPosition(
            (pos: any) => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 1500, maximumAge: 600000 },
          );
        });
      }
    } catch { /* no geolocation — ok */ }

    const haversine = (a: number, b: number, c: number, d: number) => {
      const R = 6371;
      const toRad = (x: number) => (x * Math.PI) / 180;
      const dLat = toRad(c - a);
      const dLng = toRad(d - b);
      const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng/2)**2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };

    let ranked: NearbyWanderer[];
    if (userLat !== null && userLng !== null) {
      const lat0 = userLat as number;
      const lng0 = userLng as number;
      ranked = seeds
        .map(s => ({ ...s, distance_km: Math.round(haversine(lat0, lng0, (s as any).lat, (s as any).lng) * 10) / 10 }))
        .sort((a, b) => (a.distance_km ?? 999999) - (b.distance_km ?? 999999))
        .slice(0, 18);
    } else {
      // No location — pick a globally-spread sample so the screen still feels alive.
      ranked = [...seeds]
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);
    }

    setWanderers(ranked);
    setLoading(false);
  };

  const renderWandererCard = ({ item }: { item: NearbyWanderer }) => {
    const lastSeen = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recently';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/me/profile/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {item.avatar_url && (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.trail_name}</Text>
            <Text style={styles.tier} numberOfLines={1}>
              {item.tier.toUpperCase()} · {item.nights_walked} nights
            </Text>
            <Text style={styles.lastSeen}>Seen at {lastSeen}</Text>
          </View>

          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.green} />
            </View>
          )}

          <Ionicons name="chevron-forward" size={16} color={colors.ink3} style={styles.chevron} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Nearby Wanderkinder" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      ) : wanderers.length === 0 ? (
        <WKEmpty
          icon="people-outline"
          title="No walkers nearby"
          message="Check back later — the road is always moving."
        />
      ) : (
        <FlatList
          data={wanderers}
          renderItem={renderWandererCard}
          keyExtractor={w => w.id}
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  tier: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.xs,
  },
  lastSeen: {
    ...typography.caption,
    color: colors.ink3,
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(39,134,74,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
