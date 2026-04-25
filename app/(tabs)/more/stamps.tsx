import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Stamp } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { toast } from '../../../src/lib/toast';

export default function StampsCollection({ embedded = false }: { embedded?: boolean }) {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);

  useEffect(() => {
    fetchStamps();
  }, []);

  const fetchStamps = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('stamps')
        .select('*')
        .eq('walker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStamps((data || []) as Stamp[]);
    } catch (err) {
      console.error('Failed to fetch stamps:', err);
      toast.error('Could not load your stamps. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  const renderStamp = useCallback(
    ({ item }: { item: Stamp }) => (
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
    ),
    [router]
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="stamp" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>No stamps yet</Text>
      <Text style={styles.emptyText}>Your collection will grow as you stay with hosts.</Text>
    </View>
  );

  const Wrapper = embedded ? View : SafeAreaView;
  const wrapperProps = embedded ? { style: styles.container } : { style: styles.container, edges: ['top'] as const };

  if (loading) {
    return (
      <Wrapper {...(wrapperProps as any)}>
        {!embedded && (
          <View style={styles.header}>
            <View style={styles.headerLabel}>
              <View style={styles.headerDot} />
              <Text style={styles.headerLabelText}>STAMPS</Text>
            </View>
            <Text style={styles.headerTitle}>Your Collection</Text>
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
            <Text style={styles.headerLabelText}>STAMPS</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Your Collection</Text>
            <View style={styles.stampCount}>
              <Text style={styles.stampCountText}>{stamps.length}</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={stamps}
        renderItem={renderStamp}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={15}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        initialNumToRender={15}
      />

      {/* FAB — Create or Scan Stamp */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowFabMenu(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* FAB Menu Modal */}
      <Modal
        visible={showFabMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFabMenu(false)}
      >
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={() => setShowFabMenu(false)}
        >
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/(tabs)/more/stamps/give' as any);
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.amberBg }]}>
                <Ionicons name="create-outline" size={20} color={colors.amber} />
              </View>
              <View style={styles.fabMenuInfo}>
                <Text style={styles.fabMenuTitle}>Create Stamp</Text>
                <Text style={styles.fabMenuSub}>Add a stamp manually</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/(tabs)/more/scan' as any);
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="scan-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.fabMenuInfo}>
                <Text style={styles.fabMenuTitle}>Scan Stamp</Text>
                <Text style={styles.fabMenuSub}>Scan a QR code from a host</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Wrapper>
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    paddingBottom: 90,
  },
  fabMenu: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 8,
    width: 240,
    gap: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  fabMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuInfo: { flex: 1 },
  fabMenuTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  fabMenuSub: { fontSize: 11, color: colors.ink3, marginTop: 1 },
});
