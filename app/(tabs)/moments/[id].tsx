import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Moment, Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type MomentWithAuthor = Moment & { author?: Profile };

export default function MomentDetail() {
  useAuthGuard();

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [moment, setMoment] = useState<MomentWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoment();
  }, [id]);

  const fetchMoment = useCallback(async () => {
    try {
      const { data: momentData } = await supabase
        .from('moments')
        .select('*, author:profiles!moments_author_id_fkey(*)')
        .eq('id', id)
        .single();

      if (momentData) {
        setMoment(momentData as MomentWithAuthor);
      }
    } catch (err) {
      console.error('Failed to fetch moment:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!moment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={typography.bodySm}>Moment not found</Text>
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
        <Text style={styles.headerTitle}>Moment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.momentSection}>
        {/* Author */}
        <TouchableOpacity style={styles.authorRow}>
          <View style={styles.avatar}>
            {moment?.author?.avatar_url ? (
              <Image source={{ uri: moment.author.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={16} color={colors.ink3} />
            )}
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{moment?.author?.trail_name || 'Wanderkind'}</Text>
            <Text style={styles.momentTime}>{formatTime(moment?.created_at || '')}</Text>
          </View>
        </TouchableOpacity>

        {/* Photo */}
        {moment?.photo_url && (
          <Image
            source={{ uri: moment.photo_url }}
            style={styles.momentPhoto}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <Text style={styles.momentContent}>{moment?.content}</Text>

        {/* Location */}
        {moment?.location_name && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.ink3} />
            <Text style={styles.locationText}>{moment.location_name}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
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
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  momentSection: { paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: 16, flex: 1 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  momentTime: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  momentPhoto: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    marginBottom: 12,
  },
  momentContent: {
    ...typography.body,
    color: colors.ink,
    marginBottom: 10,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: { fontSize: 11, color: colors.ink3 },
});
