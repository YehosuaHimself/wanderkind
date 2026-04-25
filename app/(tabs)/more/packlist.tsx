import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type PackItem = {
  id: string;
  name: string;
  packed: boolean;
};

type PackCategory = {
  title: string;
  icon: string;
  items: PackItem[];
  expanded: boolean;
};

export default function PacklistScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [categories, setCategories] = useState<PackCategory[]>([
    {
      title: 'Essentials',
      icon: 'checkmark-circle-outline',
      expanded: true,
      items: [
        { id: 'e1', name: 'Passport/ID', packed: false },
        { id: 'e2', name: 'Credit cards & cash', packed: false },
        { id: 'e3', name: 'Phone & charger', packed: false },
        { id: 'e4', name: 'Medications', packed: false },
      ],
    },
    {
      title: 'Clothing',
      icon: 'shirt-outline',
      expanded: true,
      items: [
        { id: 'c1', name: 'Hiking boots', packed: false },
        { id: 'c2', name: 'Socks (7 pairs)', packed: false },
        { id: 'c3', name: 'Underwear (7 pairs)', packed: false },
        { id: 'c4', name: 'Shirt (moisture-wicking)', packed: false },
        { id: 'c5', name: 'Jacket (waterproof)', packed: false },
      ],
    },
    {
      title: 'Hygiene',
      icon: 'water-outline',
      expanded: true,
      items: [
        { id: 'h1', name: 'Toothbrush & paste', packed: false },
        { id: 'h2', name: 'Soap/shampoo', packed: false },
        { id: 'h3', name: 'Towel (quick-dry)', packed: false },
        { id: 'h4', name: 'Sunscreen', packed: false },
      ],
    },
    {
      title: 'Electronics',
      icon: 'battery-charging-outline',
      expanded: false,
      items: [
        { id: 'el1', name: 'Headlamp/flashlight', packed: false },
        { id: 'el2', name: 'Power bank', packed: false },
        { id: 'el3', name: 'USB cables', packed: false },
      ],
    },
    {
      title: 'Documents',
      icon: 'document-outline',
      expanded: false,
      items: [
        { id: 'd1', name: 'Pilgrim credential', packed: false },
        { id: 'd2', name: 'Travel insurance', packed: false },
        { id: 'd3', name: 'Maps/guidebook', packed: false },
      ],
    },
  ]);

  const toggleCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories[index].expanded = !newCategories[index].expanded;
    setCategories(newCategories);
  };

  const toggleItem = (categoryIndex: number, itemId: string) => {
    const newCategories = [...categories];
    const item = newCategories[categoryIndex].items.find((i) => i.id === itemId);
    if (item) {
      item.packed = !item.packed;
    }
    setCategories(newCategories);
  };

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const packedItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.packed).length,
    0
  );
  const packingPercent = Math.round((packedItems / totalItems) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Packlist" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <WKCard variant="gold">
          <View style={styles.progressSection}>
            <View style={styles.progressText}>
              <Text style={[typography.h3, { color: colors.amber }]}>
                {packingPercent}%
              </Text>
              <Text style={[typography.bodySm, { color: colors.ink3 }]}>
                {packedItems} of {totalItems} items
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${packingPercent}%` },
                ]}
              />
            </View>
          </View>
        </WKCard>

        {/* Categories */}
        {categories.map((category, catIndex) => (
          <View key={category.title} style={styles.categorySection}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(catIndex)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon as any} size={18} color={colors.amber} />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryCount}>
                {category.items.filter((i) => i.packed).length}/{category.items.length}
              </Text>
              <Ionicons
                name={category.expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.ink3}
              />
            </TouchableOpacity>

            {category.expanded && (
              <View style={styles.itemsList}>
                {category.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemRow, item.packed && styles.itemRowPacked]}
                    onPress={() => toggleItem(catIndex, item.id)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.checkbox}>
                      {item.packed ? (
                        <Ionicons name="checkmark" size={14} color={colors.amber} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.itemName,
                        item.packed && styles.itemNamePacked,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Tips Card */}
        <WKCard variant="parchment" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.amber} />
            <Text style={[typography.h3, { color: colors.ink }]}>Packing Tips</Text>
          </View>
          <Text style={[typography.bodySm, { color: colors.ink2, marginTop: spacing.md }]}>
            Keep your pack under 8kg (18 lbs). Focus on multi-purpose items and share weight with fellow walkers.
          </Text>
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  progressSection: { gap: spacing.lg },
  progressText: { alignItems: 'center', marginBottom: spacing.sm },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  categorySection: { marginBottom: spacing.lg },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { flex: 1, ...typography.body, color: colors.ink, fontWeight: '600' },
  categoryCount: { ...typography.caption, color: colors.amber, fontWeight: '600' },
  itemsList: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: 0 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    gap: spacing.md,
  },
  itemRowPacked: { backgroundColor: colors.amberBg + '30' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: { flex: 1, ...typography.body, color: colors.ink2 },
  itemNamePacked: { color: colors.amber, textDecorationLine: 'line-through' },
  tipsCard: { marginTop: spacing.xl },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
