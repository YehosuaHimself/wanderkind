import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { BlogPost } from '../../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function BookEntry() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [entry, setEntry] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const fetchEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setEntry(data as BlogPost);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to fetch entry:', err);
    } finally {
      setLoading(false);
    }
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

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={typography.bodySm}>Entry not found</Text>
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
        <TouchableOpacity onPress={() => router.push(`/(tabs)/more/book/${id}/edit`)}>
          <Ionicons name="pencil" size={24} color={colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Cover Image */}
        {entry.cover_image && (
          <Image source={{ uri: entry.cover_image }} style={styles.coverImage} resizeMode="cover" />
        )}

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{entry.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.ink3} />
            <Text style={styles.date}>
              {new Date(entry.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          {entry.location_name && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.ink3} />
              <Text style={styles.location}>{entry.location_name}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.body}>{entry.content}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{entry.word_count}</Text>
            <Text style={styles.statLabel}>words</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  headerSpacer: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: spacing.xl },
  coverImage: { width: '100%', height: 240, backgroundColor: colors.surfaceAlt },
  titleSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  title: { ...typography.h1, color: colors.ink, marginBottom: 12, lineHeight: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  date: { ...typography.bodySm, color: colors.ink3 },
  location: { ...typography.bodySm, color: colors.amber, fontWeight: '600' },
  contentSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  body: { ...typography.body, color: colors.ink, lineHeight: 28 },
  statsSection: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.amber },
  statLabel: { ...typography.bodySm, color: colors.ink3, marginTop: 4 },
});
