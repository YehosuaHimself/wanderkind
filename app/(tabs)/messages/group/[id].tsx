import React, { useState, useEffect, useRef } from 'react';
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
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/stores/auth';
import { Message, Profile } from '../../../../src/types/database';

type MessageWithAuthor = Message & { sender?: Profile };
type GroupThread = {
  id: string;
  name: string;
  participant_ids: string[];
  created_at: string;
};

export default function GroupChat() {
  const router = useRouter();
  const { id: threadId } = useLocalSearchParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupThread | null>(null);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchGroup();
  }, [threadId]);

  const fetchGroup = async () => {
    try {
      // Fetch group thread
      const { data: groupData } = await supabase
        .from('group_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (groupData) {
        setGroup(groupData as GroupThread);

        // Fetch participants
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', groupData.participant_ids);
        if (profilesData) setParticipants(profilesData as Profile[]);
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as MessageWithAuthor[]);
      }
    } catch (err) {
      console.error('Failed to fetch group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user || !messageText.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content: messageText.trim(),
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
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageWithAuthor }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.messageHeader}>
            <View style={styles.avatar}>
              {item.sender?.avatar_url ? (
                <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={10} color={colors.ink3} />
              )}
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          {!isOwn && (
            <Text style={styles.senderName}>{item.sender?.trail_name || 'Wanderkind'}</Text>
          )}
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
            <Ionicons name="information-circle-outline" size={24} color={colors.ink} />
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
          <Text style={styles.headerTitle}>{group?.name || 'Group Chat'}</Text>
          <Text style={styles.headerSubtitle}>{participants.length} members</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="information-circle-outline" size={24} color={colors.ink} />
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
          placeholder="Message group..."
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
  return new Date(iso).toLocaleDateString();
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
  headerSubtitle: { fontSize: 10, letterSpacing: 1.5, color: colors.amber, marginTop: 2 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageHeader: { marginRight: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  messageBubbleOwn: { backgroundColor: colors.amber },
  messageBubbleOther: { backgroundColor: colors.surfaceAlt },
  senderName: { fontSize: 10, fontWeight: '600', color: colors.amber, marginBottom: 3 },
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
