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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type LikeRecord = {
  id: string;
  moment_id: string;
  user_id: string;
  user?: Profile;
  created_at: string;
};

export default function MomentLikes() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { momentId } = useLocalSearchParams();
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikes();
  }, [momentId]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('moment_likes')
        .select('*, user:profiles!moment_likes_user_id_fkey(*)')
        .eq('moment_id', momentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLikes((data || []) as LikeRecord[]);
    } catch (err) {
      console.error('Failed to fetch likes:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderLike = ({ item }: { item: LikeRecord }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push(`/(tabs)/me/profile/${item.user_id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {item.user?.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={18} color={colors.ink3} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user?.trail_name || 'Wanderkind'}</Text>
        <Text style={styles.tierBadge}>{item.user?.tier?.toUpperCase() || 'WALKER'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={48} color={colors.amberLine} />
      <Text style={styles.emptyTitle}>No likes yet</Text>
      <Text style={styles.emptyText}>This moment will light up soon.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Likes</Text>
          <View style={styles.headerSpacer} />
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes</Text>
        <Text style={styles.likeCount}>{likes.length}</Text>
      </View>

      <FlatList
        data={likes}
        renderItem={renderLike}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink, flex: 1, textAlign: 'center' },
  headerSpacer: {},
  likeCount: { fontSize: 13, fontWeight: '600', color: colors.red },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  tierBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.amber,
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
