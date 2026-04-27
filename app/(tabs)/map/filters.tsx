import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { hostTypeConfig } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function Filters() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [category, setCategory] = useState<string[]>(['free', 'donativo', 'budget']);
  const [labels, setLabels] = useState<string[]>([]);

  const [minBeds, setMinBeds] = useState(1);
  const [maxBeds, setMaxBeds] = useState(10);
  const [verification, setVerification] = useState<string[]>(['self', 'community', 'association', 'wanderkind']);
  const [distance, setDistance] = useState(50);
  const [amenities, setAmenities] = useState<string[]>([]);
  if (isLoading) return null;

  const bedOptions = [1, 2, 3, 4, 5, 10];
  const distanceOptions = [5, 10, 25, 50, 100];
  const verificationLevels = ['self', 'community', 'association', 'wanderkind'];
  const amenityOptions = ['WiFi', 'Kitchen', 'Laundry', 'Hot Shower', 'Garden', 'Parking'];

  const toggleCategory = (c: string) => {
    setCategory(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const toggleLabel = (lbl: string) => {
    setLabels(prev =>
      prev.includes(lbl) ? prev.filter(x => x !== lbl) : [...prev, lbl]
    );
  };

  const toggleVerification = (level: string) => {
    setVerification(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleApply = () => {
    // Apply filters and navigate back
    router.back();
  };

  const handleReset = () => {
    setCategory(['free', 'donativo', 'budget']);
    setLabels([]);
    setMinBeds(1);
    setMaxBeds(10);
    setVerification(['self', 'community', 'association', 'wanderkind']);
    setDistance(50);
    setAmenities([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Filters" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* ★ CATEGORY — Wanderkind = Free Travel */}
          <WKCard>
            <Text style={styles.sectionTitle}>★ Category</Text>
            <Text style={styles.sectionSub}>Wanderkind = Free Travel. Pick what you can pay.</Text>
            <View style={styles.optionGroup}>
              {([
                { key: 'free',     label: 'Free',                 color: '#5A7A2B' },
                { key: 'donativo', label: 'Donativo · pay what you can', color: '#C8762A' },
                { key: 'budget',   label: 'Budget · under €50',   color: '#B8862C' },
              ]).map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    styles.option,
                    category.includes(c.key) && styles.optionActive,
                    { borderColor: category.includes(c.key) ? c.color : colors.border }
                  ]}
                  onPress={() => toggleCategory(c.key)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      category.includes(c.key) && { backgroundColor: c.color }
                    ]}>
                      {category.includes(c.key) && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.optionLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Secondary labels — type of place */}
          <WKCard>
            <Text style={styles.sectionTitle}>Type of place</Text>
            <Text style={styles.sectionSub}>Optional. Filter inside the categories above.</Text>
            <View style={styles.amenityGroup}>
              {[
                'albergue','monastery','parish','church','refuge','camping',
                'gite','pension','wanderhost','community','public','association',
              ].map(lbl => (
                <TouchableOpacity
                  key={lbl}
                  style={[
                    styles.amenityChip,
                    labels.includes(lbl) && styles.amenityChipActive
                  ]}
                  onPress={() => toggleLabel(lbl)}
                >
                  <Text style={[
                    styles.amenityText,
                    labels.includes(lbl) && styles.amenityTextActive
                  ]}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Bed Count */}
          <WKCard>
            <Text style={styles.sectionTitle}>Minimum Beds</Text>
            <View style={styles.bedOptions}>
              {bedOptions.map(count => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.bedOption,
                    minBeds === count && styles.bedOptionActive
                  ]}
                  onPress={() => setMinBeds(count)}
                >
                  <Text style={[
                    styles.bedText,
                    minBeds === count && styles.bedTextActive
                  ]}>
                    {count}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Distance */}
          <WKCard>
            <Text style={styles.sectionTitle}>Distance Radius: {distance} km</Text>
            <View style={styles.distanceOptions}>
              {distanceOptions.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.distanceOption,
                    distance === d && styles.distanceOptionActive
                  ]}
                  onPress={() => setDistance(d)}
                >
                  <Text style={[
                    styles.distanceText,
                    distance === d && styles.distanceTextActive
                  ]}>
                    {d} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Verification Level */}
          <WKCard>
            <Text style={styles.sectionTitle}>Verification Level</Text>
            <View style={styles.optionGroup}>
              {verificationLevels.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.option,
                    verification.includes(level) && styles.optionActive,
                  ]}
                  onPress={() => toggleVerification(level)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      verification.includes(level) && { backgroundColor: colors.amber }
                    ]}>
                      {verification.includes(level) && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.optionLabel}>
                    {level === 'self' ? 'Self Verified' :
                     level === 'community' ? 'Community Verified' :
                     level === 'association' ? 'Association Verified' :
                     'Wanderkind Verified'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>

          {/* Features */}
          <WKCard>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.amenityGrid}>
              {amenityOptions.map(amenity => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.amenityChip,
                    amenities.includes(amenity) && styles.amenityChipActive
                  ]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text style={[
                    styles.amenityChipText,
                    amenities.includes(amenity) && styles.amenityChipTextActive
                  ]}>
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </WKCard>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <WKButton
          title="Reset"
          onPress={handleReset}
          variant="secondary"
          style={styles.resetBtn}
        />
        <WKButton
          title="Apply Filters"
          onPress={handleApply}
          style={styles.applyBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionSub: { ...typography.caption, color: colors.ink3, marginTop: -4, marginBottom: 8 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  optionGroup: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    backgroundColor: 'rgba(200,118,42,0.05)',
  },
  checkboxContainer: {
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  bedOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  bedOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bedOptionActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  bedText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
  },
  bedTextActive: {
    color: '#FFFFFF',
  },
  distanceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  distanceOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceOptionActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  distanceText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  distanceTextActive: {
    color: '#FFFFFF',
  },
  amenityGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  amenityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  amenityChipActive: {
    backgroundColor: colors.parchment,
    borderColor: colors.border,
  },
  amenityChipText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  amenityChipTextActive: {
    color: colors.parchmentInk,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  resetBtn: {
    flex: 1,
  },
  applyBtn: {
    flex: 1,
  },
});
