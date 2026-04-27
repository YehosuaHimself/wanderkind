/**
 * Moments · Likes — list of profiles who liked a moment (WK-111).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Image, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';

type LikeRow = {
  id: string;
  moment_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    trail_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
};

export default function MomentLikes() {
  useAuthGuard();
  const router = useRouter();
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    if (!momentId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('moment_likes')
        .select('*, user:profiles(id, trail_name, avatar_url, bio)')
        .eq('moment_id', momentId)
        .order('created_at', { ascending: false });
      setLikes((data as any[]) || []);
    } finally {
      setLoading(false);
    }
  }, [momentId]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const renderRow = useCallback(({ item }: { item: LikeRow }) => {
    const u = item.user;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => u?.id && router.push(`/(tabs)/me/profile/${u.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {u?.avatar_url ? (
            <Image source={{ uri: u.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={18} color={colors.ink3} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{u?.trail_name ?? 'Wanderkind'}</Text>
          {u?.bio ? <Text style={styles.bio} numberOfLines={1}>{u.bio}</Text> : null}
        </View>
        <Ionicons name="heart" size={18} color={colors.red} />
      </TouchableOpacity>
    );
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Likes" showBack />
        <View style={styles.center}><ActivityIndicator color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={`Likes · ${likes.length}`} showBack />
      <FlatList
        data={likes}
        keyExtractor={l => l.id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <WKEmpty
            icon="heart-outline"
            title="No likes yet"
            message="Be the first to mark this moment with a heart."
            iconColor={colors.amberLine}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.borderLt,
  },
  avatar: {
    width: 40, height: 40, borderRadius: radii.phone, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  body: { flex: 1 },
  name: { ...typography.bodySm, fontWeight: '600', color: colors.ink },
  bio: { ...typography.caption, color: colors.ink3, marginTop: 2 },
});
