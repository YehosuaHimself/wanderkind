import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, isEmpty, enforceMaxLength, canPerformAction, LIMITS } from '../../../src/lib/validate';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/stores/auth';
import { Message, Profile, Thread } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { SEED_PROFILES } from '../../../src/data/seed-profiles';

type MessageWithAuthor = Message & { sender?: Profile };

export default function ChatThread() {
  useAuthGuard();

  const router = useRouter();
  const { id: threadId } = useLocalSearchParams();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSeedProfile, setIsSeedProfile] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = useCallback(async () => {
    try {
      // Check if this is a seed profile (starts with 'p-')
      if (typeof threadId === 'string' && threadId.startsWith('p-')) {
        setIsSeedProfile(true);
        const seedProfile = SEED_PROFILES.find(p => p.id === threadId);
        if (seedProfile) {
          setOtherUser({
            id: seedProfile.id,
            trail_name: seedProfile.trail_name,
            avatar_url: seedProfile.avatar_url,
            tier: seedProfile.tier,
          } as Profile);
        }

        // Check for pending message from new.tsx (sent before navigating here)
        const pendingMessages: MessageWithAuthor[] = [];
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const pendingKey = `wk-pending-msg-${threadId}`;
          const pendingRaw = window.sessionStorage.getItem(pendingKey);
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              pendingMessages.push({
                id: `local-${Date.now()}`,
                thread_id: threadId,
                sender_id: pending.sender_id,
                content: pending.content,
                message_type: 'text',
                metadata: null,
                created_at: pending.created_at,
                read_at: null,
                sender: user as unknown as Profile,
              });
            } catch {}
            window.sessionStorage.removeItem(pendingKey);
          }
        }

        setMessages(pendingMessages);
        setLoading(false);
        return;
      }

      const { data: threadData } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadData) {
        setThread(threadData);

        // Get other participant
        const otherId = threadData.participant_ids?.find((id: string) => id !== user?.id);
        if (otherId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherId)
            .single();
          if (profile) setOtherUser(profile);
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as MessageWithAuthor[]);
        // Mark as read
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('thread_id', threadId)
          .is('read_at', null);
      }
    } catch (err) {
      console.error('Failed to fetch thread:', err);
      toast.error('Could not load conversation');
    } finally {
      setLoading(false);
    }
  }, [threadId, user?.id]);

  const handleSend = async () => {
    if (!user || !messageText.trim()) return;

    // Validate message text
    if (isEmpty(messageText)) {
      toast.error('Please enter a message');
      return;
    }

    const sanitized = sanitizeText(messageText);
    if (!enforceMaxLength(sanitized, LIMITS.messageText)) {
      toast.error(`Message cannot exceed ${LIMITS.messageText} characters`);
      return;
    }

    // Prevent double-send with 500ms cooldown
    if (!canPerformAction('send-message', 500)) {
      return; // Silently ignore if too fast
    }

    setSending(true);
    try {
      if (isSeedProfile) {
        // For seed profiles, just add message to local state
        const localMessage: MessageWithAuthor = {
          id: Date.now().toString(),
          thread_id: threadId as string,
          sender_id: user.id,
          content: sanitized,
          message_type: 'text',
          metadata: null,
          created_at: new Date().toISOString(),
          read_at: null,
          sender: user as unknown as Profile,
        };
        setMessages([...messages, localMessage]);
        setMessageText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            sender_id: user.id,
            content: sanitized,
            message_type: 'text',
          })
          .select('*, sender:profiles!messages_sender_id_fkey(*)')
          .single();

        if (error) throw error;

        if (data) {
          setMessages([...messages, data as MessageWithAuthor]);
          setMessageText('');
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageWithAuthor }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatar}>
            {item.sender?.avatar_url ? (
              <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={12} color={colors.ink3} />
            )}
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter} />
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.ink} />
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{otherUser?.trail_name || 'Wanderkind'}</Text>
          <Text style={styles.headerSubtitle}>{otherUser?.tier?.toUpperCase() || 'WALKER'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.ink3}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !messageText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.amber} />
          ) : (
            <Ionicons name="send" size={18} color={colors.amber} />
          )}
        </TouchableOpacity>
      </View>
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
  return `${days}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink },
  headerSubtitle: { fontSize: 10, letterSpacing: 2, color: colors.amber, marginTop: 2 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  messageRowOwn: { justifyContent: 'flex-end' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: { width: '100%', height: '100%' },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  messageBubbleOwn: { backgroundColor: colors.amber },
  messageBubbleOther: { backgroundColor: colors.surfaceAlt },
  messageText: { ...typography.bodySm, color: colors.ink },
  messageTextOwn: { color: colors.surface },
  messageTime: { fontSize: 10, color: colors.ink3, marginTop: 4 },
  messageTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
