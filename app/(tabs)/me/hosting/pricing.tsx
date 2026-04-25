import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKInput } from '../../../../src/components/ui/WKInput';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const PRICING_TYPES = [
  {
    id: 'free',
    label: 'Free',
    color: colors.green,
    description: 'Wanderkinder stay at no cost',
    needsPrice: false,
  },
  {
    id: 'donativo',
    label: 'Donativo',
    color: colors.gold,
    description: 'Guests decide the amount',
    needsPrice: true,
  },
  {
    id: 'budget',
    label: 'Budget',
    color: colors.blue,
    description: 'Affordable nightly rate',
    needsPrice: true,
  },
  {
    id: 'paid',
    label: 'Paid',
    color: colors.ink2,
    description: 'Premium nightly rate',
    needsPrice: true,
  },
];

export default function PricingScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [hostType, setHostType] = useState('donativo');
  const [pricePerNight, setPricePerNight] = useState('25');
  const [donativoSuggestion, setDonativoSuggestion] = useState('15-25');
  const [loading, setLoading] = useState(false);

  const currentType = PRICING_TYPES.find((t) => t.id === hostType);
  const needsPrice = currentType?.needsPrice || false;

  const handleSave = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Pricing Setup" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hosting Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosting Type</Text>
            <Text style={styles.sectionHint}>
              Choose how your accommodation is offered
            </Text>
          </View>

          {PRICING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                hostType === type.id && styles.typeCardActive,
              ]}
              onPress={() => setHostType(type.id)}
            >
              <View style={styles.typeLeft}>
                <View
                  style={[
                    styles.typeCheckbox,
                    hostType === type.id && styles.typeCheckboxActive,
                    { borderColor: type.color },
                  ]}
                >
                  {hostType === type.id && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={type.color}
                    />
                  )}
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDescription}>
                    {type.description}
                  </Text>
                </View>
              </View>
              <View style={[styles.typeDot, { backgroundColor: type.color }]} />
            </TouchableOpacity>
          ))}

          {/* Pricing Input */}
          {hostType === 'free' ? (
            <WKCard variant="parchment">
              <View style={styles.freeSection}>
                <Ionicons name="heart" size={24} color={colors.green} />
                <Text style={styles.freeTitle}>Pure Hospitality</Text>
                <Text style={styles.freeText}>
                  Your generosity offers wanderkinder the gift of genuine welcome
                </Text>
              </View>
            </WKCard>
          ) : hostType === 'donativo' ? (
            <View style={styles.pricingSection}>
              <WKCard>
                <Text style={styles.priceLabel}>Suggested Donation Range</Text>
                <WKInput
                  value={donativoSuggestion}
                  onChangeText={setDonativoSuggestion}
                  placeholder="e.g., 15-25"
                />
                <Text style={styles.priceHint}>
                  Guests will see this as guidance, but choose their own amount
                </Text>
              </WKCard>
            </View>
          ) : (
            <View style={styles.pricingSection}>
              <WKCard>
                <Text style={styles.priceLabel}>Price per Night</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.currencySymbol}>EUR</Text>
                  <WKInput
                    value={pricePerNight}
                    onChangeText={setPricePerNight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    style={styles.priceField}
                  />
                </View>
                <Text style={styles.priceHint}>
                  This is the amount guests will pay for each night
                </Text>
              </WKCard>
            </View>
          )}

          {/* Info Card */}
          <WKCard variant="gold">
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.amber} />
              <Text style={styles.infoTitle}>Pricing Guide</Text>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                <Text style={styles.infoBold}>Free:</Text> Perfect for those focused on hospitality values
              </Text>
              <Text style={styles.infoItem}>
                <Text style={styles.infoBold}>Donativo:</Text> Guests contribute what they can
              </Text>
              <Text style={styles.infoItem}>
                <Text style={styles.infoBold}>Budget:</Text> Affordable nightly rate (10-30 EUR)
              </Text>
              <Text style={styles.infoItem}>
                <Text style={styles.infoBold}>Paid:</Text> Premium comfort and amenities
              </Text>
            </View>
          </WKCard>

          {/* Save Button */}
          <WKButton
            title={loading ? 'Saving...' : 'Save Pricing'}
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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  typeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  typeLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  typeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  typeCheckboxActive: {
    backgroundColor: colors.amberBg,
  },
  typeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  typeLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  typeDescription: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  typeDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
  },
  pricingSection: {
    gap: spacing.md,
  },
  priceLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    ...typography.h3,
    color: colors.ink,
    fontWeight: '600',
  },
  priceField: {
    flex: 1,
  },
  priceHint: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  freeSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  freeTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  freeText: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  infoList: {
    gap: spacing.md,
  },
  infoItem: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
  saveBtn: {
    marginBottom: spacing.lg,
  },
});
