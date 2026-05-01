import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';
import CommunityMapView from '../../../src/components/map/CommunityMapView';

// Direct imports — avoids React.lazy rendering flickers
import WaysContent from '../more/ways';
import GroupWalkContent from '../more/group-walk';

type TabMode = 'map' | 'ways' | 'groups';

const TABS: { key: TabMode; label: string; icon: string }[] = [
  { key: 'map',    label: 'Map',    icon: 'compass-outline' },
  { key: 'ways',   label: 'Ways',   icon: 'trail-sign-outline' },
  { key: 'groups', label: 'Groups', icon: 'people-outline' },
];

const HEADER_TITLES: Record<TabMode, string> = {
  map:    'Community',
  ways:   'Walking Routes',
  groups: 'WanderGroups',
};

export default function MyWayScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>('map');

  return (
    <RouteErrorBoundary routeName="My Way">
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.amberLine} />
            <Text style={styles.headerLabelText}>MY WAY</Text>
          </View>
          <Text style={styles.headerTitle}>{HEADER_TITLES[activeTab]}</Text>
        </View>

        {/* ── Tab toggle ─────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { haptic.selection(); setActiveTab(tab.key); }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={15}
                color={activeTab === tab.key ? colors.amber : colors.ink3}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <View style={styles.content}>
          {activeTab === 'map'    && <CommunityMapView />}
          {activeTab === 'ways'   && <WaysContent embedded />}
          {activeTab === 'groups' && <GroupWalkContent embedded />}
        </View>

      </SafeAreaView>
    </RouteErrorBoundary>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  amberLine: {
    width: 14,
    height: 1.5,
    backgroundColor: colors.amber,
    borderRadius: 1,
  },
  headerLabelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.bg,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink3,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: colors.amber,
  },

  content: { flex: 1 },
});
