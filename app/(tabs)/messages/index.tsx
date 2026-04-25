import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type Thread = {
  id: string;
  other_user: {
    id: string;
    trail_name: string;
    avatar_url: string | null;
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export default function MessagesScreen() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('threads')
      .select('*')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      // Transform to thread format
      const mapped = data.map((t: any) => ({
        id: t.id,
        other_user: {
          id: t.user_a === user.id ? t.user_b : t.user_a,
          trail_name: t.other_trail_name ?? 'Wanderkind',
          avatar_url: t.other_avatar_url ?? null,
        },
        last_message: t.last_message ?? '',
        last_message_at: t.last_message_at,
        unread_count: t.unread_count ?? 0,
      }));
      setThreads(mapped);
    }
  }, [user]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  };

  const renderThread = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={styles.threadRow}
      onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {item.other_user.avatar_url ? (
          <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={18} color={colors.ink3} />
        )}
      </View>
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName} numberOfLines={1}>{item.other_user.trail_name}</Text>
          <Text style={styles.threadTime}>{formatTime(item.last_message_at)}</Text>
        </View>
        <Text style={styles.threadPreview} numberOfLines={1}>{item.last_message}</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-outline" size={48} color={colors.amberLine} />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyText}>
        Connect with hosts and wanderkinder{'\n'}along your Way.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MESSAGES</Text>
        </View>
        <Text style={styles.headerTitle}>Conversations</Text>
      </View>

      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  list: {
    paddingVertical: 4,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44 },
  threadInfo: { flex: 1 },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  threadName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  threadTime: {
    fontSize: 11,
    color: colors.ink3,
  },
  threadPreview: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLt,
    marginLeft: spacing.xl + 56,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 48,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
});
