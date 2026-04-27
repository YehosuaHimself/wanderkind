import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKInput } from '../../../../src/components/ui/WKInput';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const HOST_TYPES = [
  { id: 'free', label: 'Free', color: colors.green },
  { id: 'donativo', label: 'Donativo', color: colors.gold },
  { id: 'budget', label: 'Budget', color: colors.blue },
  { id: 'paid', label: 'Paid', color: colors.ink2 },
];

const AMENITIES = ['WiFi', 'Kitchen', 'Laundry', 'Shower', 'Towels', 'Parking', 'Garden'];

export default function ListingEdit() {
  const { user, isLoading } = useAuthGuard();
  const [name, setName] = useState('Casa Tranquilo');
  const [description, setDescription] = useState('Warm welcome for wanderkinder.');
  const [beds, setBeds] = useState('2');
  const [selectedType, setSelectedType] = useState('donativo');
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'Kitchen', 'Shower']);
  const [loading, setLoading] = useState(false);
  if (isLoading) return null;


  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Edit Listing" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Name */}
          <WKInput
            label="Property Name"
            value={name}
            onChangeText={setName}
            placeholder="Casa Tranquilo"
          />

          {/* Description */}
          <WKInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What makes your home special?"
            multiline
            numberOfLines={4}
          />

          {/* Beds */}
          <WKInput
            label="Number of Beds"
            value={beds}
            onChangeText={setBeds}
            keyboardType="number-pad"
            placeholder="2"
          />

          {/* Host Type */}
          <Text style={styles.sectionLabel}>Hosting Type</Text>
          <View style={styles.typeGrid}>
            {HOST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <View
                  style={[
                    styles.typeIndicator,
                    { backgroundColor: type.color },
                  ]}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Features */}
          <Text style={styles.sectionLabel}>Features</Text>
          <WKCard>
            {AMENITIES.map((amenity) => (
              <View key={amenity} style={styles.amenityRow}>
                <Text style={styles.amenityLabel}>{amenity}</Text>
                <Switch
                  value={amenities.includes(amenity)}
                  onValueChange={() => toggleAmenity(amenity)}
                  trackColor={{ false: colors.border, true: colors.amberBg }}
                  thumbColor={amenities.includes(amenity) ? colors.amber : colors.ink3}
                />
              </View>
            ))}
          </WKCard>

          {/* Save Button */}
          <WKButton
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading}
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
  sectionLabel: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeCardActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
  },
  typeLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: colors.amber,
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  amenityRow__last: {
    borderBottomWidth: 0,
  },
  amenityLabel: {
    ...typography.body,
    color: colors.ink,
  },
  saveBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
