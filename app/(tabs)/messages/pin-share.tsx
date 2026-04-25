import React, { useState, useEffect } from 'react';
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
import { Booking, Profile } from '../../../src/types/database';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type BookingWithDetails = Booking & { host?: { name: string } };

export default function PINShare() {
  useAuthGuard();

  const router = useRouter();
  const { threadId } = useLocalSearchParams();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [pin, setPin] = useState('');
  const [pinType, setPinType] = useState<'pin' | 'keybox' | 'combo'>('pin');
  const [expiresIn, setExpiresIn] = useState('24'); // hours
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, host:hosts!bookings_host_id_fkey(name)')
        .eq('walker_id', user?.id || '')
        .eq('status', 'accepted')
        .order('check_in', { ascending: true });

      if (error) throw error;
      setBookings((data || []) as BookingWithDetails[]);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSharePIN = async () => {
    if (!user || !selectedBooking || !pin.trim()) {
      showAlert('Missing information', 'Please select a booking and enter the PIN.');
      return;
    }

    setSharing(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

      // Update booking with door code
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          door_code: pin.trim(),
          door_code_type: pinType,
          door_code_expires: expiresAt.toISOString(),
        })
        .eq('id', selectedBooking.id);

      if (updateError) throw updateError;

      // Send message with door code
      const { error: messageError } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        content: `Door access: ${pin.trim()}`,
        message_type: 'door_code',
        metadata: {
          door_code: pin.trim(),
          door_code_type: pinType,
          expires_at: expiresAt.toISOString(),
          host_name: selectedBooking.host?.name,
        },
      });

      if (messageError) throw messageError;

      showAlert('Success', 'Door PIN shared securely.');
      router.back();
    } catch (err) {
      console.error('Share failed:', err);
      showAlert('Error', 'Failed to share PIN. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const renderBookingOption = ({ item }: { item: BookingWithDetails }) => (
    <TouchableOpacity
      style={[
        styles.bookingCard,
        selectedBooking?.id === item.id && styles.bookingCardSelected,
      ]}
      onPress={() => setSelectedBooking(item)}
    >
      <View>
        <Text style={styles.hostName}>{item.host?.name || 'Host'}</Text>
        <Text style={styles.checkInDate}>
          {new Date(item.check_in).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.checkmark}>
        {selectedBooking?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color={colors.green} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Door Access</Text>
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
        <Text style={styles.headerTitle}>Share Door Access</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Select Booking */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Which booking?</Text>
          {bookings.length > 0 ? (
            <FlatList
              data={bookings}
              renderItem={renderBookingOption}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="key-outline" size={32} color={colors.amberLine} />
              <Text style={styles.emptyText}>No confirmed bookings</Text>
            </View>
          )}
        </View>

        {selectedBooking && (
          <>
            {/* Access Type */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Access Type</Text>
              <View style={styles.typeButtons}>
                {(['pin', 'keybox', 'combo'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      pinType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setPinType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        pinType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type === 'pin' ? 'PIN' : type === 'keybox' ? 'Keybox' : 'Combo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Code Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {pinType === 'pin' ? 'PIN Number' : pinType === 'keybox' ? 'Keybox Code' : 'Combination'}
              </Text>
              <TextInput
                style={styles.codeInput}
                placeholder="e.g., 1234"
                placeholderTextColor={colors.ink3}
                value={pin}
                onChangeText={setPin}
                maxLength={20}
                keyboardType="number-pad"
              />
            </View>

            {/* Expiration */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Expires in</Text>
              <View style={styles.expirationButtons}>
                {['1', '6', '24', '48'].map(hours => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.expirationButton,
                      expiresIn === hours && styles.expirationButtonActive,
                    ]}
                    onPress={() => setExpiresIn(hours)}
                  >
                    <Text
                      style={[
                        styles.expirationButtonText,
                        expiresIn === hours && styles.expirationButtonTextActive,
                      ]}
                    >
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.green} />
              <Text style={styles.infoText}>
                This PIN will be sent securely in your chat message and automatically expire.
              </Text>
            </View>
          </>
        )}
      </View>

      {selectedBooking && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={sharing}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, !pin.trim() && styles.shareBtnDisabled]}
            onPress={handleSharePIN}
            disabled={sharing || !pin.trim()}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="key" size={16} color={colors.surface} />
                <Text style={styles.shareBtnText}>Share PIN</Text>
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
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  section: { marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionLabel: { ...typography.bodySm, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  bookingCardSelected: {
    backgroundColor: colors.goldBg,
    borderColor: colors.gold,
  },
  hostName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  checkInDate: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  checkmark: { width: 24, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.bodySm, color: colors.ink3, marginTop: 8 },
  typeButtons: { flexDirection: 'row', gap: spacing.md },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  typeButtonText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  typeButtonTextActive: { color: colors.surface },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.ink,
    fontWeight: '600',
    letterSpacing: 2,
  },
  expirationButtons: { flexDirection: 'row', gap: spacing.md },
  expirationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  expirationButtonActive: { backgroundColor: colors.goldBg, borderColor: colors.gold },
  expirationButtonText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  expirationButtonTextActive: { color: colors.gold },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.greenBg,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  infoText: { ...typography.bodySm, color: colors.green, flex: 1, lineHeight: 19 },
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
  shareBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: colors.surface },
});
