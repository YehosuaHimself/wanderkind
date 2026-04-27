import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface CampingSpot {
  id: string;
  name: string;
  type: 'wild' | 'official';
  description: string;
  image_url?: string;
  lat: number;
  lng: number;
  amenities: string[];
  capacity?: number;
  water?: boolean;
  fire?: boolean;
  trash?: boolean;
  price?: string;
  phone?: string;
  website?: string;
}

const MOCK_CAMPING: Record<string, CampingSpot> = {
  '1': {
    id: '1',
    name: 'Mountain View Campground',
    type: 'official',
    description: 'A beautiful official campground with stunning mountain views. Ideal for groups and those who prefer amenities.',
    lat: 43.5,
    lng: -7.5,
    amenities: ['Toilets', 'Water', 'Parking', 'Shop'],
    capacity: 50,
    water: true,
    fire: false,
    trash: true,
    price: '€10-15/night',
    phone: '+34 982 555 123',
    website: 'mountainviewcamp.es',
  },
};

export default function CampingDetail() {
  const { user, isLoading } = useAuthGuard();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [spot, setSpot] = useState<CampingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  if (isLoading) return null;


  useEffect(() => {
    if (id) {
      setLoading(false);
      setSpot(MOCK_CAMPING[id] || null);
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Camping Spot" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Camping Spot" />
        <WKEmpty
          icon="alert-circle-outline"
          title="Not Found"
          message="This camping spot could not be loaded"
        />
      </SafeAreaView>
    );
  }

  const typeColor = spot.type === 'official' ? colors.blue : colors.tramp;
  const typeLabel = spot.type === 'official' ? 'OFFICIAL CAMPGROUND' : 'WILD CAMPING';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={spot.name} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {spot.image_url && (
          <Image source={{ uri: spot.image_url }} style={styles.heroImage} />
        )}

        <View style={styles.content}>
          {/* Header Card */}
          <WKCard variant="gold">
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
              <Ionicons
                name={spot.type === 'official' ? 'home' : 'bed-outline'}
                size={14}
                color={typeColor}
              />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {typeLabel}
              </Text>
            </View>

            <Text style={styles.spotName}>{spot.name}</Text>

            {spot.price && (
              <View style={styles.priceRow}>
                <Ionicons name="pricetag" size={14} color={colors.green} />
                <Text style={styles.price}>{spot.price}</Text>
              </View>
            )}
          </WKCard>

          {/* Description */}
          {spot.description && (
            <WKCard>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{spot.description}</Text>
            </WKCard>
          )}

          {/* Facilities & Features */}
          {(spot.amenities.length > 0 || spot.capacity || spot.water || spot.fire || spot.trash) && (
            <WKCard variant="parchment">
              <Text style={styles.sectionTitle}>Facilities & Features</Text>

              {spot.capacity && (
                <View style={styles.facilityRow}>
                  <Ionicons name="people" size={16} color={colors.amber} />
                  <View style={styles.facilityContent}>
                    <Text style={styles.facilityLabel}>Capacity</Text>
                    <Text style={styles.facilityValue}>{spot.capacity} people</Text>
                  </View>
                </View>
              )}

              <View style={styles.facilityToggleRow}>
                <FacilityToggle icon="water" label="Water" enabled={spot.water ?? false} />
                <FacilityToggle icon="flame" label="Fire" enabled={spot.fire ?? false} />
                <FacilityToggle icon="trash" label="Trash" enabled={spot.trash ?? false} />
              </View>

              {spot.amenities.length > 0 && (
                <View style={styles.amenitiesSection}>
                  <Text style={styles.amenitiesLabel}>Features</Text>
                  <View style={styles.amenitiesGrid}>
                    {spot.amenities.map((amenity, i) => (
                      <View key={i} style={styles.amenityTag}>
                        <Text style={styles.amenityText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </WKCard>
          )}

          {/* Contact Details */}
          {(spot.phone || spot.website) && (
            <WKCard>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.detailsList}>
                {spot.phone && (
                  <TouchableOpacity style={styles.detailRow}>
                    <Ionicons name="call" size={16} color={colors.amber} />
                    <Text style={styles.detailValue}>{spot.phone}</Text>
                    <Ionicons name="open" size={14} color={colors.ink3} />
                  </TouchableOpacity>
                )}
                {spot.website && (
                  <TouchableOpacity style={styles.detailRow}>
                    <Ionicons name="globe" size={16} color={colors.amber} />
                    <Text style={styles.detailValue}>{spot.website}</Text>
                    <Ionicons name="open" size={14} color={colors.ink3} />
                  </TouchableOpacity>
                )}
              </View>
            </WKCard>
          )}

          {/* Map Button */}
          <WKButton
            title="View on Map"
            onPress={() => {
              // Navigate to map centered on camping spot
            }}
            fullWidth
            style={styles.mapButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FacilityToggle({ icon, label, enabled }: { icon: string; label: string; enabled: boolean }) {
  return (
    <View style={[styles.facilityToggle, !enabled && styles.facilityToggleDisabled]}>
      <Ionicons
        name={icon as any}
        size={16}
        color={enabled ? colors.green : colors.ink3}
      />
      <Text style={[styles.facilityToggleLabel, !enabled && styles.facilityToggleLabelDisabled]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  typeText: {
    fontFamily: 'Courier New',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  spotName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  price: {
    ...typography.h3,
    color: colors.green,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  facilityContent: {
    flex: 1,
  },
  facilityLabel: {
    ...typography.caption,
    color: colors.ink3,
  },
  facilityValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  facilityToggleRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  facilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  facilityToggleDisabled: {
    opacity: 0.5,
  },
  facilityToggleLabel: {
    ...typography.bodySm,
    color: colors.green,
    fontWeight: '500',
  },
  facilityToggleLabelDisabled: {
    color: colors.ink3,
  },
  amenitiesSection: {
    paddingTop: spacing.md,
  },
  amenitiesLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    marginBottom: spacing.sm,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: colors.parchment,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  amenityText: {
    ...typography.bodySm,
    color: colors.parchmentInk,
    fontWeight: '500',
  },
  detailsList: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  detailValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
    flex: 1,
  },
  mapButton: {
    marginVertical: spacing.lg,
  },
});
