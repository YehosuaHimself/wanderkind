import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';
import CommunityMapView from '../../../src/components/map/CommunityMapView';

import WaysContent from '../more/ways';
import GroupWalkContent from '../more/group-walk';

type TabMode = 'routes' | 'map' | 'groups';

const TABS: { key: TabMode; label: string }[] = [
  { key: 'routes',  label: 'ROUTES' },
  { key: 'map',     label: 'MAP' },
  { key: 'groups',  label: 'WANDERGROUPS' },
];

export default function MyWayScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>('routes');

  return (
    <RouteErrorBoundary routeName="My Way">
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* ── H-LABEL header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.amberLine} />
            <Text style={styles.headerLabelText}>MY WAY</Text>
          </View>
        </View>

        {/* ── Large caps tab toggle ──────────────────────────────────── */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => { haptic.selection(); setActiveTab(tab.key); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content ───────────────────────────────────────────────── */}
        <View style={styles.content}>
          {activeTab === 'routes' && <WaysContent embedded />}
          {activeTab === 'map'    && <CommunityMapView />}
          {activeTab === 'groups' && <GroupWalkContent embedded />}
        </View>

      </SafeAreaView>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    marginBottom: 0,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.ink3,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.amber,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.amber,
    borderRadius: 1,
  },

  content: { flex: 1 },
});
