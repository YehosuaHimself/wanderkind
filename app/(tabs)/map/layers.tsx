import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

interface LayerState {
  hosts: boolean;
  wanderkinder: boolean;
  routes: boolean;
  pois: boolean;
  camping: boolean;
  [key: string]: boolean;
}

export default function Layers() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [layers, setLayers] = useState<LayerState>({
    hosts: true,
    wanderkinder: true,
    routes: true,
    pois: false,
    camping: false,
  });

  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClose = () => {
    router.back();
  };

  const layerDescriptions = {
    hosts: 'Accommodation hosts along the way',
    wanderkinder: 'Other walkers currently on the road',
    routes: 'European walking ways and trails',
    pois: 'Points of interest: churches, monuments, restaurants',
    camping: 'Camping spots and wild camping areas',
  };

  const layerIcons = {
    hosts: 'home' as const,
    wanderkinder: 'people' as const,
    routes: 'map' as const,
    pois: 'location' as const,
    camping: 'tent' as const,
  };

  const layerColors = {
    hosts: colors.amber,
    wanderkinder: colors.blue,
    routes: colors.green,
    pois: colors.gold,
    camping: colors.tramp,
  };

  const sortedLayers = Object.entries(layers).sort(([a], [b]) => {
    const order = ['hosts', 'wanderkinder', 'routes', 'pois', 'camping'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Map Layers</Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Choose which layers to display on the map. Disabling layers improves performance on slower connections.
          </Text>

          {/* Layer Cards */}
          <View style={styles.layersList}>
            {sortedLayers.map(([key, enabled]) => {
              const icon = layerIcons[key as keyof typeof layerIcons];
              const color = layerColors[key as keyof typeof layerColors];
              const description = layerDescriptions[key as keyof typeof layerDescriptions];

              return (
                <WKCard key={key} style={styles.layerCard}>
                  <View style={styles.layerHeader}>
                    <View style={styles.layerLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                        <Ionicons name={icon} size={18} color={color} />
                      </View>
                      <View style={styles.layerInfo}>
                        <Text style={styles.layerName}>
                          {key === 'hosts' ? 'Hosts' :
                           key === 'wanderkinder' ? 'Wanderkinder' :
                           key === 'routes' ? 'Routes' :
                           key === 'pois' ? 'Points of Interest' :
                           'Camping Spots'}
                        </Text>
                        <Text style={styles.layerDescription}>{description}</Text>
                      </View>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={() => toggleLayer(key as keyof LayerState)}
                      thumbColor={enabled ? color : colors.ink3}
                      trackColor={{ false: colors.borderLt, true: `${color}40` }}
                    />
                  </View>
                </WKCard>
              );
            })}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={colors.amber} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Performance Tip</Text>
                <Text style={styles.infoMessage}>
                  Disabling Routes and POIs can improve map responsiveness on slow connections.
                </Text>
              </View>
            </View>
          </View>

          {/* Legend */}
          <WKCard variant="parchment">
            <Text style={styles.legendTitle}>Marker Colors</Text>
            <View style={styles.legendGrid}>
              <LegendItem color={colors.green} label="FREE" />
              <LegendItem color={colors.gold} label="DONATIVO" />
              <LegendItem color={colors.blue} label="BUDGET" />
              <LegendItem color={colors.ink3} label="PAID" />
            </View>
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  description: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  layersList: {
    gap: spacing.md,
  },
  layerCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  layerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  layerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerInfo: {
    flex: 1,
  },
  layerName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  layerDescription: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  infoSection: {
    gap: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  infoMessage: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  legendTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  legendGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: 'Courier New',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.parchmentInk,
  },
});
