import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { BlogPost } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function WalkingBook() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [entries, setEntries] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries((data || []) as BlogPost[]);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEntry = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => router.push(`/(tabs)/more/book/${item.id}`)}
      activeOpacity={0.7}
    >
      {item.cover_image && (
        <Image source={{ uri: item.cover_image }} style={styles.coverImage} resizeMode="cover" />
      )}
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.entryMeta}>
          <Ionicons name="calendar-outline" size={12} color={colors.ink3} />
          <Text style={styles.entryDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        {item.location_name && (
          <View style={styles.entryLocation}>
            <Ionicons name="location-outline" size={12} color={colors.ink3} />
            <Text style={styles.entryLocationText}>{item.location_name}</Text>
          </View>
        )}
        <Text style={styles.wordCount}>{item.word_count} words</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>Your Walking Book</Text>
      <Text style={styles.emptyText}>Start documenting your journey with entries and photos.</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/more/book/create')}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.createButtonText}>Write First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLabelText}>BOOK</Text>
          </View>
          <Text style={styles.headerTitle}>Your Journal</Text>
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>BOOK</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Your Journal</Text>
          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.createFab}
              onPress={() => router.push('/(tabs)/more/book/create')}
            >
              <Ionicons name="add" size={18} color={colors.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
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
  headerTitle: { ...typography.h2, color: colors.ink, flex: 1 },
  createFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },
  entryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  coverImage: { width: 100, height: 120, backgroundColor: colors.surfaceAlt },
  entryContent: { flex: 1, padding: spacing.lg },
  entryTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink, marginBottom: 8, lineHeight: 18 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  entryDate: { ...typography.caption, color: colors.ink3 },
  entryLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  entryLocationText: { ...typography.caption, color: colors.ink3 },
  wordCount: { ...typography.caption, color: colors.amber, fontWeight: '600' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: { ...typography.h2, color: colors.ink, marginTop: 16, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.amber,
    borderRadius: 10,
  },
  createButtonText: { fontSize: 14, fontWeight: '600', color: colors.surface },
});
