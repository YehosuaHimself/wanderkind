import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, hostTypeConfig } from '../../lib/theme';
import { haptic } from '../../lib/haptics';

interface LayerState {
  hosts: boolean;
  wanderkinder: boolean;
  ways: boolean;
  wifi: boolean;
  churches: boolean;
  parishes: boolean;
  mountains: boolean;
  camping: boolean;
  community: boolean;
}

interface LayersPanelProps {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
  onClose: () => void;
}

const LAYER_CONFIG: { key: keyof LayerState; label: string; icon: string; color: string }[] = [
  { key: 'hosts', label: 'Wanderhosts', icon: 'home', color: colors.amber },
  { key: 'wanderkinder', label: 'Wanderkinder', icon: 'people', color: '#C8762A' },
  { key: 'ways', label: 'The Ways', icon: 'map', color: colors.green },
  { key: 'wifi', label: 'Public WiFi', icon: 'wifi', color: '#0ea5e9' },
  { key: 'churches', label: 'Churches', icon: 'business', color: '#8B4513' },
  { key: 'parishes', label: 'Parishes', icon: 'home', color: '#6B21A8' },
  { key: 'mountains', label: 'Mountains', icon: 'triangle', color: '#6B7280' },
  { key: 'camping', label: 'Camping', icon: 'bonfire', color: '#059669' },
  { key: 'community', label: 'Community', icon: 'people-circle', color: '#C8762A' },
];

function LayersPanelInner({ layers, onToggle, onClose }: LayersPanelProps) {
  return (
    <View style={styles.layersPanel}>
      <View style={styles.layersPanelHeader}>
        <Text style={styles.layersPanelTitle}>MAP LAYERS</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {LAYER_CONFIG.map(({ key, label, icon, color }) => (
        <TouchableOpacity
          key={key}
          style={styles.layerRow}
          onPress={() => { haptic.selection(); onToggle(key); }}
          activeOpacity={0.7}
        >
          <View style={[styles.layerIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={16} color={color} />
          </View>
          <Text style={[styles.layerLabel, !layers[key] && { color: colors.ink3 }]}>{label}</Text>
          <Switch
            value={layers[key]}
            onValueChange={() => onToggle(key)}
            trackColor={{ false: colors.borderLt, true: `${color}40` }}
            thumbColor={layers[key] ? color : '#ccc'}
            style={{ transform: [{ scale: 0.8 }] }}
          />
        </TouchableOpacity>
      ))}
      {/* Legend */}
      <View style={styles.layersLegend}>
        <Text style={styles.legendTitle}>HOST COLORS</Text>
        <View style={styles.legendRow}>
          {(['free', 'donativo', 'budget', 'paid'] as const).map(t => (
            <View key={t} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: hostTypeConfig[t].color }]} />
              <Text style={styles.legendLabel}>{hostTypeConfig[t].label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export const LayersPanel = React.memo(LayersPanelInner);

const styles = StyleSheet.create({
  layersPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: 260,
  },
  layersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  layersPanelTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.ink3,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  layerIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  layersLegend: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.ink3,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.ink3,
    textTransform: 'capitalize',
  },
});
