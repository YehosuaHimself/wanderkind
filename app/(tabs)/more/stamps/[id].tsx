import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../../src/lib/theme';
import { supabase } from '../../../../src/lib/supabase';
import { toast } from '../../../../src/lib/toast';
import { Stamp, Profile } from '../../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

type StampWithHost = Stamp & { host?: Profile };

export default function StampDetail() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [stamp, setStamp] = useState<StampWithHost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStamp();
  }, [id]);

  const fetchStamp = async () => {
    try {
      const { data, error } = await supabase
        .from('stamps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Stamp not found
          toast.error('Stamp not found');
          router.back();
          return;
        }
        throw error;
      }

      if (data) {
        setStamp(data as StampWithHost);
      }
    } catch (err) {
      console.error('Failed to fetch stamp:', err);
      toast.error('Failed to load stamp');
      router.back();
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

  if (!stamp) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerLoading}>
          <Text style={typography.bodySm}>Stamp not found</Text>
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Large Stamp Image */}
        {stamp.photo_url ? (
          <Image source={{ uri: stamp.photo_url }} style={styles.stampImage} resizeMode="cover" />
        ) : (
          <View style={styles.stampPlaceholder}>
            <Ionicons name="ribbon" size={64} color={colors.amber} />
          </View>
        )}

        {/* Stamp Info */}
        <View style={styles.infoSection}>
          <Text style={styles.hostName}>{stamp.host_name}</Text>
          <Text style={styles.date}>
            {new Date(stamp.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {stamp.route_km && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="pin" size={14} color={colors.amber} />
                <Text style={styles.statText}>{stamp.route_km} km on the way</Text>
              </View>
            </View>
          )}

          {stamp.night_number && (
            <View style={styles.nightBadge}>
              <Text style={styles.nightNumber}>Night {stamp.night_number}</Text>
            </View>
          )}
        </View>

        {/* Note */}
        {stamp.note && (
          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>Your Note</Text>
            <Text style={styles.noteText}>{stamp.note}</Text>
          </View>
        )}

        {/* Verification Info */}
        <View style={styles.verificationSection}>
          <Ionicons name="shield-checkmark" size={18} color={colors.green} />
          <Text style={styles.verificationText}>Verified stamp from host</Text>
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
  stampImage: { width: '100%', height: 400, backgroundColor: colors.surfaceAlt },
  stampPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  hostName: { ...typography.h1, color: colors.ink, marginBottom: 4 },
  date: { ...typography.bodySm, color: colors.ink3, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { ...typography.bodySm, color: colors.amber, fontWeight: '600' },
  nightBadge: {
    backgroundColor: colors.goldBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  nightNumber: { ...typography.bodySm, color: colors.gold, fontWeight: '700' },
  noteSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.lg },
  noteText: { ...typography.body, color: colors.ink, lineHeight: 24 },
  verificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.greenBg,
    borderRadius: 10,
  },
  verificationText: { ...typography.bodySm, color: colors.green, fontWeight: '600' },
});
