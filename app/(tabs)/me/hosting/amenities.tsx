import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi' as const },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant' as const },
  { id: 'laundry', label: 'Laundry', icon: 'basket' as const },
  { id: 'shower', label: 'Shower', icon: 'water' as const },
  { id: 'towels', label: 'Towels', icon: 'pricetag' as const },
  { id: 'parking', label: 'Parking', icon: 'car' as const },
  { id: 'garden', label: 'Garden', icon: 'leaf' as const },
  { id: 'workspace', label: 'Workspace', icon: 'laptop' as const },
  { id: 'heating', label: 'Heating', icon: 'flame' as const },
  { id: 'ac', label: 'Air Conditioning', icon: 'snow' as const },
  { id: 'breakfast', label: 'Breakfast', icon: 'nutrition' as const },
];

export default function AmenitiesScreen() {
  const { user, isLoading } = useAuthGuard();
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
  if (isLoading) return null;

    wifi: true,
    kitchen: true,
    laundry: false,
    shower: true,
    towels: true,
    parking: false,
    garden: true,
    workspace: false,
    heating: true,
    ac: false,
    breakfast: false,
  });

  const toggleAmenity = (id: string) => {
    setAmenities((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const enabledCount = Object.values(amenities).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Features" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Summary */}
          <WKCard variant="gold">
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>You have</Text>
              <Text style={styles.summaryValue}>{enabledCount}</Text>
              <Text style={styles.summaryLabel}>features enabled</Text>
            </View>
          </WKCard>

          {/* Features */}
          <WKCard>
            {AMENITIES.map((amenity, idx) => (
              <View
                key={amenity.id}
                style={[
                  styles.amenityRow,
                  idx < AMENITIES.length - 1 && styles.amenityRowBorder,
                ]}
              >
                <View style={styles.amenityLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={amenity.icon}
                      size={20}
                      color={colors.amber}
                    />
                  </View>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
                <Switch
                  value={amenities[amenity.id] || false}
                  onValueChange={() => toggleAmenity(amenity.id)}
                  trackColor={{ false: colors.border, true: colors.amberBg }}
                  thumbColor={
                    amenities[amenity.id] ? colors.amber : colors.ink3
                  }
                />
              </View>
            ))}
          </WKCard>

          {/* Recommendation */}
          <WKCard variant="parchment">
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={colors.ink2} />
              <Text style={styles.tipTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Listings with more features receive more requests. Highlight what makes your space special.
            </Text>
          </WKCard>

          {/* Save Button */}
          <WKButton
            title="Save Features"
            onPress={handleSave}
            fullWidth
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  summary: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  summaryValue: {
    ...typography.h1,
    color: colors.amber,
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  amenityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  amenityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityLabel: {
    ...typography.body,
    color: colors.ink,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  tipText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  saveBtn: {
    marginBottom: spacing.lg,
  },
});
