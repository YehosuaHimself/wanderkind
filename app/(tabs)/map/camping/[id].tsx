/**
 * Camping Detail — fetches a real hosts row (host_type='camping')
 * from Supabase by id. The id is a hosts.id UUID passed from the map.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { supabase } from '../../../src/lib/supabase';

type CampingHost = {
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
  amenities: string[];
  house_rules: string[];
  capacity: number;
  price_range: string | null;
  availability_notes: string | null;
  country: string | null;
  region: string | null;
  is_available: boolean;
};

const AMENITY_ICONS: Record<string, string> = {
  toilets: 'body-outline', shower: 'water-outline', water: 'water',
  wifi: 'wifi-outline', parking: 'car-outline', electricity: 'flash-outline',
  shop: 'bag-outline', restaurant: 'restaurant-outline', fire: 'flame-outline',
  pool: 'water-outline', laundry: 'shirt-outline', kitchen: 'restaurant-outline',
};

export default function CampingDetail() {
  const { isLoading } = useAuthGuard();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [spot, setSpot] = useState<CampingHost | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('hosts')
        .select('id, name, host_type, description, gallery, lat, lng, phone, email, website, address, amenities, house_rules, capacity, price_range, availability_notes, country, region, is_available')
        .eq('id', id)
        .maybeSingle();
      setSpot(data as CampingHost | null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openDirections = () => {
    if (!spot) return;
    const url = Platform.OS === 'ios'
      ? `maps:?daddr=${spot.lat},${spot.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    Linking.openURL(url);
  };

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Camping" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      </SafeAreaView>
    );
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Camping" showBack />
        <WKEmpty icon="alert-circle-outline" title="Not found" message="This camping spot could not be loaded." />
      </SafeAreaView>
    );
  }

  const heroImage = spot.gallery?.[0] ?? null;
  const isWild = spot.host_type === 'camping' && !spot.address;
  const typeLabel = isWild ? 'Wild Camping' : 'Campsite';
  const typeColor = isWild ? '#3F6112' : colors.amber;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={spot.name} showBack />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
        ) : null}

        <View style={styles.content}>
          {/* Header card */}
          <WKCard variant="parchment">
            <View style={styles.badge}>
              <View style={[styles.badgeIcon, { backgroundColor: `${typeColor}20` }]}>
                <Ionicons name="bonfire-outline" size={16} color={typeColor} />
              </View>
              <Text style={[styles.badgeText, { color: typeColor }]}>{typeLabel.toUpperCase()}</Text>
              {spot.is_available ? (
                <View style={styles.availChip}>
                  <Text style={styles.availText}>OPEN</Text>
                </View>
              ) : (
                <View style={[styles.availChip, { backgroundColor: '#B03A3A20' }]}>
                  <Text style={[styles.availText, { color: '#B03A3A' }]}>CLOSED</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{spot.name}</Text>

            <View style={styles.metaRow}>
              {spot.capacity > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={colors.ink2} />
                  <Text style={styles.metaText}>{spot.capacity} capacity</Text>
                </View>
              )}
              {spot.price_range && (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.ink2} />
                  <Text style={styles.metaText}>{spot.price_range}</Text>
                </View>
              )}
              {(spot.region || spot.country) && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.ink2} />
                  <Text style={styles.metaText}>{[spot.region, spot.country].filter(Boolean).join(', ')}</Text>
                </View>
              )}
            </View>
          </WKCard>

          {/* Description */}
          {spot.description ? (
            <WKCard>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{spot.description}</Text>
            </WKCard>
          ) : null}

          {/* Amenities */}
          {spot.amenities?.length > 0 ? (
            <WKCard>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityGrid}>
                {spot.amenities.map((a: string, i: number) => {
                  const key = a.toLowerCase().replace(/\s+/g, '');
                  const icon = AMENITY_ICONS[key] ?? 'checkmark-circle-outline';
                  return (
                    <View key={i} style={styles.amenityItem}>
                      <Ionicons name={icon as any} size={18} color={colors.green} />
                      <Text style={styles.amenityText}>{a}</Text>
                    </View>
                  );
                })}
              </View>
            </WKCard>
          ) : null}

          {/* Contact + location */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailList}>
              {spot.address ? <DetailRow icon="home-outline" label="Address" value={spot.address} onPress={openDirections} /> : null}
              {spot.phone ? <DetailRow icon="call-outline" label="Phone" value={spot.phone} onPress={() => Linking.openURL(`tel:${spot.phone}`)} /> : null}
              {spot.email ? <DetailRow icon="mail-outline" label="Email" value={spot.email} onPress={() => Linking.openURL(`mailto:${spot.email}`)} /> : null}
              {spot.website ? <DetailRow icon="globe-outline" label="Website" value={spot.website} onPress={() => Linking.openURL(spot.website!.startsWith('http') ? spot.website! : `https://${spot.website}`)} /> : null}
              {spot.availability_notes ? <DetailRow icon="time-outline" label="Hours / Notes" value={spot.availability_notes} /> : null}
              <DetailRow icon="navigate-outline" label="Coordinates" value={`${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`} onPress={openDirections} />
            </View>
          </WKCard>

          {/* House rules */}
          {spot.house_rules?.length > 0 ? (
            <WKCard>
              <Text style={styles.sectionTitle}>Rules</Text>
              {spot.house_rules.map((r: string, i: number) => (
                <View key={i} style={styles.ruleRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.green} />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </WKCard>
          ) : null}

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
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  badgeIcon: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, fontFamily: 'Courier New' },
  availChip: { backgroundColor: '#27864A20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  availText: { fontSize: 9, fontWeight: '800', color: '#27864A', letterSpacing: 1, fontFamily: 'Courier New' },
  name: { ...typography.h2, color: colors.ink, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.bodySm, color: colors.ink2 },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  description: { ...typography.body, color: colors.ink2, lineHeight: 24 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  amenityText: { ...typography.bodySm, color: colors.ink },
  detailList: { gap: 0 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  detailIcon: { width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(200,118,42,0.1)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { flex: 1 },
  detailLabel: { ...typography.caption, color: colors.ink3, marginBottom: 2 },
  detailValue: { ...typography.bodySm, color: colors.ink, fontWeight: '500' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  ruleText: { ...typography.bodySm, color: colors.ink, flex: 1 },
});
