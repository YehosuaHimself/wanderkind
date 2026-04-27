import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

type MapMode = 'normal' | 'greyscale' | 'explorer';

interface MapModesPanelProps {
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  onClose: () => void;
}

const MODES: { id: MapMode; label: string; description: string; icon: string }[] = [
  { id: 'normal', label: 'Normal', description: 'OpenStreetMap (Default)', icon: 'map' },
  { id: 'greyscale', label: 'Grey/Orange', description: 'CartoDB Positron - Clean', icon: 'contrast' },
  { id: 'explorer', label: 'Terrain', description: 'OpenTopoMap - Topographic', icon: 'mountain' },
];

function MapModesPanelInner({ mapMode, onModeChange, onClose }: MapModesPanelProps) {
  return (
    <View style={styles.mapModesPanel}>
      <View style={styles.mapModesPanelHeader}>
        <Text style={styles.mapModesPanelTitle}>MAP STYLE</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {MODES.map(({ id, label, description, icon }) => (
        <TouchableOpacity
          key={id}
          style={[styles.mapModeRow, mapMode === id && styles.mapModeRowActive]}
          onPress={() => {
            onModeChange(id);
            onClose();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.mapModeIcon, mapMode === id && { backgroundColor: colors.amberBg }]}>
            <Ionicons name={icon as any} size={16} color={mapMode === id ? colors.amber : colors.ink3} />
          </View>
          <View style={styles.mapModeInfo}>
            <Text style={[styles.mapModeLabel, mapMode !== id && { color: colors.ink3 }]}>{label}</Text>
            <Text style={styles.mapModeDescription}>{description}</Text>
          </View>
          {mapMode === id && (
            <Ionicons name="checkmark-circle" size={20} color={colors.amber} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const MapModesPanel = React.memo(MapModesPanelInner);

const styles = StyleSheet.create({
  mapModesPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: 260,
  },
  mapModesPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapModesPanelTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.ink3,
  },
  mapModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  mapModeRowActive: {
    backgroundColor: colors.amberBg,
  },
  mapModeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.borderLt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapModeInfo: {
    flex: 1,
  },
  mapModeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  mapModeDescription: {
    fontSize: 11,
    color: colors.ink3,
    marginTop: 1,
  },
});
