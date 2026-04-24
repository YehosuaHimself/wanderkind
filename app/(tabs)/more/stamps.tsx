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
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Stamp } from '../../../src/types/database';

export default function StampsCollection() {
  const router = useRouter();
  const { user } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStamps();
  }, []);

  const fetchStamps = async () => {
    try {
      const { data, error } = await supabase
        .from('stamps')
        .select('*')
        .eq('walker_id', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStamps((data || []) as Stamp[]);
    } catch (err) {
      console.error('Failed to fetch stamps:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStamp = ({ item }: { item: Stamp }) => (
    <TouchableOpacity
      style={styles.stampContainer}
      onPress={() => router.push(`/(tabs)/more/stamps/${item.id}`)}
      activeOpacity={0.8}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.stampImage} />
      ) : (
        <View style={styles.stampPlaceholder}>
          <Ionicons name="document" size={32} color={colors.ink3} />
        </View>
      )}
      <View style={styles.stampOverlay}>
        <Text style={styles.hostName}>{item.host_name}</Text>
        <Text style={styles.stampDate}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="stamp" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>No stamps yet</Text>
      <Text style={styles.emptyText}>Your collection will grow as you stay with hosts.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLabelText}>STAMPS</Text>
          </View>
          <Text style={styles.headerTitle}>Your Collection</Text>
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
          <Text style={styles.headerLabelText}>STAMPS</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Your Collection</Text>
          <View style={styles.stampCount}>
            <Text style={styles.stampCountText}>{stamps.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={stamps}
        renderItem={renderStamp}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        numColumns={3}
        columnWrapperStyle={styles.row}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
    flex: 1,
  },
  stampCount: {
    backgroundColor: colors.amber,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampCountText: { fontSize: 14, fontWeight: '700', color: colors.surface },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  row: { justifyContent: 'space-between', marginBottom: spacing.lg },
  stampContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  stampImage: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  stampPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  stampOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  hostName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface,
    lineHeight: 12,
  },
  stampDate: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, marginTop: 6, textAlign: 'center' },
});
