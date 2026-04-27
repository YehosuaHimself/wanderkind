/**
 * Seed-profile chat thread (local-only).
 * Used when the user texts a seed (NPC) wanderkind. Messages persist in
 * AsyncStorage and there is never a reply.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { toast } from '../../../../src/lib/toast';
import { sanitizeText, isEmpty, enforceMaxLength, canPerformAction, LIMITS } from '../../../../src/lib/validate';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { SEED_PROFILES } from '../../../../src/data/seed-profiles';
import {
  loadSeedMessages,
  appendSeedMessage,
  type SeedMessage,
} from '../../../../src/lib/seedMessages';

export default function SeedChatThread() {
  useAuthGuard();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const profileId = String(rawId || '');

  const seed = (SEED_PROFILES as any[]).find(p => p.id === profileId) || null;

  const [messages, setMessages] = useState<SeedMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!profileId) return;
    loadSeedMessages(profileId).then(setMessages);
  }, [profileId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (isEmpty(text)) { toast.error('Please enter a message'); return; }
    const sanitized = sanitizeText(text);
    if (!enforceMaxLength(sanitized, LIMITS.messageText)) {
      toast.error(`Message cannot exceed ${LIMITS.messageText} characters`);
      return;
    }
    if (!canPerformAction('send-message', 500)) return;

    setSending(true);
    try {
      const msg = await appendSeedMessage(profileId, sanitized);
      setMessages(prev => [...prev, msg]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.error('seed send failed', err);
      toast.error('Could not send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: SeedMessage }) => (
    <View style={[styles.messageRow, styles.messageRowOwn]}>
      <View style={[styles.messageBubble, styles.messageBubbleOwn]}>
        <Text style={[styles.messageText, styles.messageTextOwn]}>{item.content}</Text>
        <Text style={[styles.messageTime, styles.messageTimeOwn]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  ), []);

  if (!seed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter}><Text style={styles.headerTitle}>Conversation</Text></View>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.centerEmpty}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.ink3} />
          <Text style={styles.emptyText}>This walker isn&apos;t available right now.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => router.push(`/(tabs)/me/profile/${seed.id}` as any)}
          activeOpacity={0.7}
        >
          {seed.avatar_url ? (
            <Image source={{ uri: seed.avatar_url }} style={styles.headerAvatar} />
          ) : null}
          <View>
            <Text style={styles.headerTitle}>{seed.trail_name}</Text>
            {seed.is_walking ? (
              <View style={styles.headerSubRow}>
                <View style={styles.dot} />
                <Text style={styles.headerSubtitle}>WALKING NOW</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.centerEmpty}>
            <Image source={{ uri: seed.avatar_url }} style={styles.bigAvatar} />
            <Text style={styles.emptyName}>{seed.trail_name}</Text>
            {seed.bio ? <Text style={styles.emptyBio}>{seed.bio}</Text> : null}
            <Text style={styles.emptyHint}>Say hello — they may be slow to reply on the trail.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.ink3}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={LIMITS.messageText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={16} color={colors.amber} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
    gap: 10,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerTitle: { ...typography.bodySm, fontWeight: '700', color: colors.ink },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  headerSubtitle: { fontSize: 9, letterSpacing: 1.5, color: colors.green, fontWeight: '700' },
  centerEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, gap: 10,
  },
  bigAvatar: { width: 76, height: 76, borderRadius: 38, marginBottom: 8 },
  emptyName: { ...typography.h3, color: colors.ink },
  emptyBio: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', paddingHorizontal: 12 },
  emptyHint: { ...typography.caption, color: colors.ink3, marginTop: 12, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.ink2, marginTop: 8 },
  messagesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.lg },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  messageBubbleOwn: { backgroundColor: colors.amber },
  messageText: { ...typography.bodySm, color: colors.ink },
  messageTextOwn: { color: colors.surface },
  messageTime: { fontSize: 10, color: colors.ink3, marginTop: 4 },
  messageTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  inputSection: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amberBg,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
