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

interface POI {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url?: string;
  distance_km?: number;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  opening_hours?: string;
}

const MOCK_POI: Record<string, POI> = {
  '1': {
    id: '1',
    name: 'Cathedral of Santiago de Compostela',
    category: 'Religious Site',
    description: 'The magnificent final destination of the Camino de Santiago journey. A stunning Romanesque and Baroque cathedral.',
    distance_km: 0.2,
    lat: 42.88044,
    lng: -8.54569,
    phone: '+34 981 57 59 00',
    website: 'catedraldesantiago.es',
    opening_hours: '7:00 AM - 9:00 PM',
  },
};

export default function POIDetail() {
  const { user, isLoading } = useAuthGuard();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  if (isLoading) return null;


  useEffect(() => {
    if (id) {
      // In a real app, fetch from Supabase
      setLoading(false);
      setPoi(MOCK_POI[id] || null);
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Point of Interest" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!poi) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Point of Interest" />
        <WKEmpty
          icon="alert-circle-outline"
          title="Not Found"
          message="This point of interest could not be loaded"
        />
      </SafeAreaView>
    );
  }

  const getCategoryIcon = (category: string) => {
    if (category === 'Religious Site') return 'church';
    if (category === 'Restaurant') return 'restaurant';
    if (category === 'Monastery') return 'library';
    if (category === 'Museum') return 'image';
    return 'location';
  };

  const getCategoryColor = (category: string) => {
    if (category === 'Religious Site') return colors.green;
    if (category === 'Restaurant') return colors.red;
    if (category === 'Monastery') return colors.amber;
    return colors.blue;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title={poi.name} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {poi.image_url && (
          <Image source={{ uri: poi.image_url }} style={styles.heroImage} />
        )}

        <View style={styles.content}>
          {/* Header Card */}
          <WKCard variant="gold">
            <View style={styles.categoryBadge}>
              <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(poi.category)}20` }]}>
                <Ionicons
                  name={getCategoryIcon(poi.category) as any}
                  size={16}
                  color={getCategoryColor(poi.category)}
                />
              </View>
              <Text style={[styles.categoryText, { color: getCategoryColor(poi.category) }]}>
                {poi.category.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.poiName}>{poi.name}</Text>

            {poi.distance_km !== undefined && (
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color={colors.amber} />
                <Text style={styles.distance}>{poi.distance_km} km away</Text>
              </View>
            )}
          </WKCard>

          {/* Description */}
          {poi.description && (
            <WKCard>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{poi.description}</Text>
            </WKCard>
          )}

          {/* Details */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsList}>
              {poi.phone && (
                <DetailRow icon="call" label="Phone" value={poi.phone} />
              )}
              {poi.website && (
                <DetailRow icon="globe" label="Website" value={poi.website} />
              )}
              {poi.opening_hours && (
                <DetailRow icon="time" label="Hours" value={poi.opening_hours} />
              )}
              <DetailRow
                icon="navigate"
                label="Coordinates"
                value={`${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)}`}
              />
            </View>
          </WKCard>

          {/* Map Button */}
          <WKButton
            title="View on Map"
            onPress={() => {
              // Navigate to map centered on POI
            }}
            fullWidth
            style={styles.mapButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={16} color={colors.amber} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  poiName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.1)',
  },
  distance: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
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
  detailsList: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(200,118,42,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.ink3,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  mapButton: {
    marginVertical: spacing.lg,
  },
});
