/**
 * POI Detail — fetches a real host row (monastery, church, tourist_info, etc.)
 * from Supabase by id. The id is a hosts.id UUID passed from the map.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';

type POI = {
  id: string;
  name: string;
  host_type: string;
  description: string | null;
  gallery: string[];
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  availability_notes: string | null;
  country: string | null;
  region: string | null;
};

function typeLabel(host_type: string): string {
  const MAP: Record<string, string> = {
    monastery: 'Monastery',
    church: 'Church / Chapel',
    tourist_info: 'Tourist Information',
    community: 'Community Space',
    albergue_parroquial: 'Parish Hostel',
  };
  return MAP[host_type] ?? host_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function typeIcon(host_type: string): string {
  if (host_type === 'monastery') return 'library-outline';
  if (host_type === 'church' || host_type === 'albergue_parroquial') return 'business-outline';
  if (host_type === 'tourist_info') return 'information-circle-outline';
  return 'location-outline';
}

function typeColor(host_type: string): string {
  if (host_type === 'monastery') return colors.amber;
  if (host_type === 'church' || host_type === 'albergue_parroquial') return '#7B68EE';
  if (host_type === 'tourist_info') return '#2E86C1';
  return colors.ink2;
}

export default function POIDetail() {
  const { isLoading } = useAuthGuard();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('hosts')
        .select('id, name, host_type, description, gallery, lat, lng, phone, email, website, address, availability_notes, country, region')
        .eq('id', id)
        .maybeSingle();
      setPoi(data as POI | null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openDirections = () => {
    if (!poi) return;
    const url = Platform.OS === 'ios'
      ? `maps:?daddr=${poi.lat},${poi.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
    Linking.openURL(url);
  };

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Point of Interest" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!poi) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Point of Interest" showBack />
        <WKEmpty
          icon="alert-circle-outline"
          title="Not found"
          message="This point of interest could not be loaded."
        />
      </SafeAreaView>
    );
  }

  const heroImage = poi.gallery?.[0] ?? null;
  const color = typeColor(poi.host_type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={poi.name} showBack />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
        ) : null}

        <View style={styles.content}>
          {/* Badge + name */}
          <WKCard variant="gold">
            <View style={styles.badge}>
              <View style={[styles.badgeIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={typeIcon(poi.host_type) as any} size={16} color={color} />
              </View>
              <Text style={[styles.badgeText, { color }]}>{typeLabel(poi.host_type).toUpperCase()}</Text>
            </View>
            <Text style={styles.poiName}>{poi.name}</Text>
            {(poi.region || poi.country) && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.amber} />
                <Text style={styles.locationText}>
                  {[poi.region, poi.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </WKCard>

          {/* Description */}
          {poi.description ? (
            <WKCard>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{poi.description}</Text>
            </WKCard>
          ) : null}

          {/* Contact details */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailList}>
              {poi.address ? <DetailRow icon="home-outline" label="Address" value={poi.address} onPress={openDirections} /> : null}
              {poi.phone ? <DetailRow icon="call-outline" label="Phone" value={poi.phone} onPress={() => Linking.openURL(`tel:${poi.phone}`)} /> : null}
              {poi.email ? <DetailRow icon="mail-outline" label="Email" value={poi.email} onPress={() => Linking.openURL(`mailto:${poi.email}`)} /> : null}
              {poi.website ? <DetailRow icon="globe-outline" label="Website" value={poi.website} onPress={() => Linking.openURL(poi.website!.startsWith('http') ? poi.website! : `https://${poi.website}`)} /> : null}
              {poi.availability_notes ? <DetailRow icon="time-outline" label="Hours / Notes" value={poi.availability_notes} /> : null}
              <DetailRow icon="navigate-outline" label="Coordinates" value={`${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}`} onPress={openDirections} />
            </View>
          </WKCard>

          <WKButton title="Get Directions" onPress={openDirections} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) {
  const inner = (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={16} color={colors.amber} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, onPress && { color: colors.amber }]}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.ink3} /> : null}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity> : inner;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 220, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.lg, gap: spacing.lg },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  badgeIcon: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, fontFamily: 'Courier New' },
  poiName: { ...typography.h2, color: colors.ink, marginBottom: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locationText: { ...typography.bodySm, color: colors.amber },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  description: { ...typography.body, color: colors.ink2, lineHeight: 24 },
  detailList: { gap: 0 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  detailIcon: { width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(200,118,42,0.1)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { flex: 1 },
  detailLabel: { ...typography.caption, color: colors.ink3, marginBottom: 2 },
  detailValue: { ...typography.bodySm, color: colors.ink, fontWeight: '500' },
});
