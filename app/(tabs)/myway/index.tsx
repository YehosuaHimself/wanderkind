import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';

// Direct imports instead of React.lazy — fixes rendering issues
import WaysContent from '../more/ways';
import StampsContent from '../more/stamps';

type TabMode = 'ways' | 'stamps';

export default function MyWayScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>('ways');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MY WAY</Text>
        </View>
        <Text style={styles.headerTitle}>
          {activeTab === 'ways' ? 'Walking Routes' : 'My Stamps'}
        </Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ways' && styles.tabActive]}
          onPress={() => setActiveTab('ways')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="compass-outline"
            size={16}
            color={activeTab === 'ways' ? colors.amber : colors.ink3}
          />
          <Text style={[styles.tabText, activeTab === 'ways' && styles.tabTextActive]}>
            Ways
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stamps' && styles.tabActive]}
          onPress={() => setActiveTab('stamps')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="ribbon-outline"
            size={16}
            color={activeTab === 'stamps' ? colors.amber : colors.ink3}
          />
          <Text style={[styles.tabText, activeTab === 'stamps' && styles.tabTextActive]}>
            Stamps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content — direct rendering, no lazy load */}
      <View style={styles.content}>
        {activeTab === 'ways' ? <WaysContent embedded /> : <StampsContent embedded />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  headerLabelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
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
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink3,
  },
  tabTextActive: {
    color: colors.amber,
  },
  content: { flex: 1 },
});
