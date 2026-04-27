import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/stores/auth';
import { BlogPost } from '../../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { toast } from '../../../../src/lib/toast';

type WritingTab = 'journal' | 'blog' | 'book';

export default function JournalHub() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WritingTab>('journal');
  const [entries, setEntries] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by type if column exists, otherwise show all
      if (activeTab === 'blog') {
        query = query.eq('visibility', 'public');
      } else if (activeTab === 'book') {
        query = query.eq('post_type', 'book');
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries((data || []) as BlogPost[]);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      toast.error('Could not load entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const tabInfo: Record<WritingTab, { icon: string; label: string; emptyTitle: string; emptyDesc: string; defaultVisibility: string }> = {
    journal: {
      icon: 'journal-outline',
      label: 'Journal',
      emptyTitle: 'Your Private Journal',
      emptyDesc: 'Write trail reflections and personal notes. Private by default — share when you\'re ready.',
      defaultVisibility: 'private',
    },
    blog: {
      icon: 'globe-outline',
      label: 'Blog',
      emptyTitle: 'Your Public Blog',
      emptyDesc: 'Share stories with the Wanderkind community and beyond. Public by default.',
      defaultVisibility: 'public',
    },
    book: {
      icon: 'book-outline',
      label: 'Book',
      emptyTitle: 'Your Walking Book',
      emptyDesc: 'Compile your journey into chapters. Private until you decide to publish.',
      defaultVisibility: 'private',
    },
  };

  const currentTab = tabInfo[activeTab];

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
          {/* Visibility indicator */}
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={(item as any).visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
              size={10}
              color={colors.ink3}
            />
            <Text style={styles.visibilityText}>
              {(item as any).visibility === 'public' ? 'Public' : 'Private'}
            </Text>
          </View>
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
      <Ionicons name={currentTab.icon as any} size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>{currentTab.emptyTitle}</Text>
      <Text style={styles.emptyText}>{currentTab.emptyDesc}</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/more/book/create')}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.createButtonText}>Write First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabelText}>JOURNAL</Text>
            <Text style={styles.headerTitle}>Your Writing</Text>
          </View>
          <TouchableOpacity
            style={styles.createFab}
            onPress={() => router.push('/(tabs)/more/book/create')}
          >
            <Ionicons name="add" size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['journal', 'blog', 'book'] as WritingTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tabInfo[tab].icon as any}
              size={18}
              color={activeTab === tab ? colors.amber : colors.ink3}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tabInfo[tab].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  createFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.amber,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink3,
  },
  tabTextActive: {
    color: colors.amber,
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
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
  },
  visibilityText: { fontSize: 9, color: colors.ink3, fontWeight: '500' },
  entryLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  entryLocationText: { ...typography.caption, color: colors.ink3 },
  wordCount: { ...typography.caption, color: colors.amber, fontWeight: '600' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 60,
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
