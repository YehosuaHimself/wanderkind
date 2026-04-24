import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

interface Stamp {
  id: string;
  host_name: string;
  location: string;
  date: string;
  category: string;
  image_url?: string;
}

export default function StampsOverviewScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStamps();
  }, [user?.id]);

  const fetchStamps = async () => {
    try {
      if (!user) return;
      const { data } = await supabase
        .from('stamps')
        .select('*')
        .eq('walker_id', user.id)
        .order('date', { ascending: false });

      setStamps(data || []);
    } catch (err) {
      console.error('Error fetching stamps:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      food: colors.passFood,
      culture: '#7C3AED',
      nature: colors.green,
      community: colors.amber,
      hospitality: colors.passHosp,
      water: colors.passWater,
      adventure: colors.tramp,
      workshops: '#D97706',
    };
    return categoryColors[category.toLowerCase()] || colors.ink3;
  };

  const renderStampCell = ({ item }: { item: Stamp }) => (
    <TouchableOpacity
      style={styles.stampCell}
      onPress={() => router.push(`/(tabs)/me/stamp/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.stampCircle,
          { borderColor: getCategoryColor(item.category) },
        ]}
      >
        <View
          style={[
            styles.stampInner,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        />
        <Text style={styles.stampLabel}>{item.category[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.hostName} numberOfLines={1}>
        {item.host_name}
      </Text>
      <Text style={styles.stampDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Your Stamps" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Your Stamps" showBack />

      {stamps.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.emptyContent}>
          <View style={styles.emptyContainer}>
            <Ionicons name="stamp" size={48} color={colors.ink3} />
            <Text style={styles.emptyText}>No stamps yet</Text>
            <Text style={styles.emptySubtext}>
              Collect artisanal stamps from hosts as you walk
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={stamps}
          renderItem={renderStampCell}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
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
  grid: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  stampCell: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  stampCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  stampInner: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    opacity: 0.15,
    position: 'absolute',
  },
  stampLabel: {
    ...typography.h3,
    color: colors.ink,
    fontWeight: '900',
  },
  hostName: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
  },
  stampDate: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
});
