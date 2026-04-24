import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, radii, shadows } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

const WAYS = [
  {
    id: 'camino-frances',
    name: 'Camino Francés',
    country: 'Spain',
    distance: '780 km',
    description: 'The most popular route to Santiago de Compostela',
    icon: 'walk',
  },
  {
    id: 'via-francigena',
    name: 'Via Francigena',
    country: 'Italy',
    distance: '1,700 km',
    description: 'Historic pilgrimage route to Rome',
    icon: 'map',
  },
  {
    id: 'koenigsweg',
    name: 'Königsweg',
    country: 'Germany',
    distance: '600 km',
    description: 'Alpine route through Bavaria and Austria',
    icon: 'mountain',
  },
  {
    id: 'chemin-st-jacques',
    name: 'Chemin de Saint-Jacques',
    country: 'France',
    distance: '1,200 km',
    description: 'French Way to Santiago de Compostela',
    icon: 'walk',
  },
  {
    id: 'routes-romeas',
    name: 'Routes Romeas',
    country: 'France',
    distance: '2,500 km',
    description: 'Network of routes from Paris to Rome',
    icon: 'compass',
  },
  {
    id: 'camino-portugues',
    name: 'Camino Portugués',
    country: 'Portugal',
    distance: '620 km',
    description: 'Portuguese Way through Lisbon',
    icon: 'walk',
  },
  {
    id: 'ruta-del-norte',
    name: 'Ruta del Norte',
    country: 'Spain',
    distance: '830 km',
    description: 'Northern coastal route to Santiago',
    icon: 'water',
  },
  {
    id: 'european-walking',
    name: 'E-Walks Network',
    country: 'Europe',
    distance: 'Various',
    description: 'Long-distance European walking routes',
    icon: 'globe',
  },
];

export default function SelectWayScreen() {
  const router = useRouter();
  const [selectedWay, setSelectedWay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { updateProfile } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedWay) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({ current_way: selectedWay });
      if (error) {
        console.error(error);
        return;
      }

      router.push('/(auth)/photo-upload');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderWayCard = ({ item }: { item: typeof WAYS[0] }) => (
    <TouchableOpacity
      style={[
        styles.wayCard,
        selectedWay === item.id && styles.wayCardSelected,
      ]}
      onPress={() => setSelectedWay(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.wayHeader}>
        <View style={styles.wayIcon}>
          <Ionicons
            name={item.icon as any}
            size={24}
            color={colors.amber}
          />
        </View>
        <View style={styles.wayTitleSection}>
          <Text style={styles.wayName}>{item.name}</Text>
          <Text style={styles.wayCountry}>{item.country}</Text>
        </View>
        {selectedWay === item.id && (
          <Ionicons name="checkmark-circle" size={24} color={colors.amber} />
        )}
      </View>
      <Text style={styles.wayDescription}>{item.description}</Text>
      <Text style={styles.wayDistance}>{item.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Choose Your First Way" showBack />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Select a route that calls to you. You can explore other Ways anytime.
        </Text>

        <FlatList
          data={WAYS}
          renderItem={renderWayCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.actions}>
        <WKButton
          title="Begin This Way"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!selectedWay || loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  wayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  wayCardSelected: {
    borderColor: colors.amber,
    borderWidth: 2,
    backgroundColor: colors.amberBg,
  },
  wayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wayTitleSection: {
    flex: 1,
    gap: spacing.xs,
  },
  wayName: {
    ...typography.h3,
    color: colors.ink,
  },
  wayCountry: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  wayDescription: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 19,
    marginLeft: 48,
  },
  wayDistance: {
    ...typography.caption,
    color: colors.amber,
    fontWeight: '600',
    marginLeft: 48,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
