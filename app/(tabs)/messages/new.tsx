import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { showAlert } from '../../../src/lib/alert';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

// Helper function to escape SQL wildcards in ILIKE queries
function escapeIlike(input: string): string {
  return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export default function NewMessage() {
  useAuthGuard();

  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; name?: string }>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-select user when passed via URL params (e.g. from feed DM button)
  useEffect(() => {
    if (params.userId && !selectedUser) {
      // Fetch from Supabase
      (async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', params.userId)
            .single();
          if (data) setSelectedUser(data as Profile);
        } catch {
          // Fallback: create minimal profile from name param
          if (params.name) {
            setSelectedUser({
              id: params.userId,
              trail_name: params.name,
            } as Profile);
          }
        }
      })();
    }
  }, [params.userId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const escapedQuery = escapeIlike(query);
        const isWkSearch = query.toUpperCase().startsWith('WK-');
        let results: Profile[] = [];

        // Search Supabase profiles by name or WK-ID
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`trail_name.ilike.%${escapedQuery}%,wanderkind_id.ilike.%${escapedQuery}%`)
          .neq('id', user?.id || '')
          .limit(10);

        if (!error && data) {
          results = data as Profile[];
        }


        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedUser || !messageText.trim()) {
      showAlert('Missing information', 'Please select a user and write a message.');
      return;
    }

    setSending(true);
    try {
      // Check if this is a seed profile (id starts with 'p-')
      const isSeedUser = selectedUser.id.startsWith('p-');

      if (isSeedUser) {
        // For seed profiles, store the first message locally and navigate to chat
        // The [id].tsx page handles seed profile chats with local state
        const initialMessage = messageText.trim();
        // Store initial message in sessionStorage so the chat page can pick it up
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(
            `wk-pending-msg-${selectedUser.id}`,
            JSON.stringify({ content: initialMessage, sender_id: user.id, created_at: new Date().toISOString() })
          );
        }
        router.replace(`/(tabs)/messages/${selectedUser.id}`);
        return;
      }

      // Real Supabase user — create or get thread
      const participantIds = [user.id, selectedUser.id].sort();
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .contains('participant_ids', participantIds)
        .single();

      let threadId = existingThread?.id;

      if (!threadId) {
        try {
          const { data: newThread, error: threadError } = await supabase
            .from('threads')
            .insert({ participant_ids: participantIds })
            .select('id')
            .single();

          if (threadError) {
            if (threadError.code === '23505') {
              const { data: retryThread, error: retryError } = await supabase
                .from('threads')
                .select('id')
                .contains('participant_ids', participantIds)
                .single();

              if (retryError) throw retryError;
              threadId = retryThread?.id;
            } else {
              throw threadError;
            }
          } else {
            threadId = newThread?.id;
          }
        } catch (insertError: any) {
          if (insertError?.code === '23505') {
            const { data: retryThread, error: retryError } = await supabase
              .from('threads')
              .select('id')
              .contains('participant_ids', participantIds)
              .single();

            if (retryError) throw retryError;
            threadId = retryThread?.id;
          } else {
            throw insertError;
          }
        }
      }

      // Send message
      const { error: messageError } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        content: messageText.trim(),
        message_type: 'text',
      });

      if (messageError) throw messageError;

      router.replace(`/(tabs)/messages/${threadId}`);
    } catch (err) {
      console.error('Send failed:', err);
      showAlert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderSearchResult = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={[styles.userCard, selectedUser?.id === item.id && styles.userCardSelected]}
      onPress={() => {
        setSelectedUser(item);
        setSearchQuery('');
        setSearchResults([]);
      }}
    >
      <View style={styles.avatar}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={18} color={colors.ink3} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.trail_name}</Text>
        <Text style={styles.userTier}>{item.tier?.toUpperCase() || 'WALKER'}</Text>
      </View>
      <Ionicons name="checkmark" size={20} color={colors.green} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Recipient Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To:</Text>
          {selectedUser ? (
            <View style={styles.selectedUserContainer}>
              <View style={styles.selectedUserAvatar}>
                {selectedUser.avatar_url ? (
                  <Image source={{ uri: selectedUser.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={16} color={colors.ink3} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedUserName}>{selectedUser.trail_name}</Text>
                <Text style={styles.selectedUserTier}>{selectedUser.tier?.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Ionicons name="close" size={20} color={colors.ink3} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Find someone..."
                placeholderTextColor={colors.ink3}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.amber} />
                </View>
              )}
              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  style={styles.searchResults}
                />
              )}
            </>
          )}
        </View>

        {/* Message Input */}
        {selectedUser && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Message:</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Write your message..."
              placeholderTextColor={colors.ink3}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
            <Text style={styles.charCount}>
              {messageText.length} / 2000
            </Text>
          </View>
        )}
      </View>

      {/* Send Button */}
      {selectedUser && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelBtn, { opacity: sending ? 0.6 : 1 }]}
            onPress={() => router.back()}
            disabled={sending}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={sending || !messageText.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.surface} />
                <Text style={styles.sendBtnText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  section: { marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionLabel: { ...typography.bodySm, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  loadingContainer: { paddingVertical: spacing.lg, alignItems: 'center' },
  searchResults: { marginTop: spacing.md },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  userCardSelected: { backgroundColor: colors.goldBg, borderColor: colors.gold },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  userTier: { fontSize: 10, letterSpacing: 2, color: colors.amber, marginTop: 2 },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  selectedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  selectedUserName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  selectedUserTier: { fontSize: 10, letterSpacing: 2, color: colors.amber, marginTop: 2 },
  messageInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { ...typography.caption, color: colors.ink3, marginTop: 6, textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sendBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontSize: 15, fontWeight: '600', color: colors.surface },
});
