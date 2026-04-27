import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';

export default function ArrivalInstructionsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Arrival Instructions" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: '#059669' + '15' }]}>
          <Ionicons name="navigate-outline" size={36} color="#059669" />
        </View>
        <Text style={styles.h1}>Arrival Instructions</Text>
        <Text style={styles.lead}>Write the 'how to find me' note once. Every confirmed walker reads it on the day they arrive — no chasing messages, no missed doors.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="hammer-outline" size={16} color={colors.amber} />
            <Text style={styles.rowText}>Free-text directions plus an optional photo of the door. Markdown-light formatting (bold, line breaks). Visible only to walkers with a confirmed booking, not on the public listing.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="git-branch-outline" size={16} color={colors.amber} />
            <Text style={styles.rowText}>Tracked as <Text style={styles.mono}>WK-123</Text> in the v1.1 refinement EPIC.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={16} color={colors.amber} />
            <Text style={styles.rowText}>The Wanderhost claim flow ships first in WK-120; per-host configuration screens follow.</Text>
          </View>
        </View>

        <Text style={styles.footer}>WANDERKIND = FREE TRAVEL</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  h1: { ...typography.h2, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  lead: {
    ...typography.body, color: colors.ink2, textAlign: 'center',
    paddingHorizontal: spacing.md, marginBottom: spacing.xl, lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderLt,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md, width: '100%', marginBottom: spacing.xl,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  rowText: { ...typography.bodySm, color: colors.ink2, flex: 1, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.borderLt },
  mono: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontWeight: '700', color: colors.amber, letterSpacing: 1,
  },
  footer: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10, letterSpacing: 3, color: colors.amber, fontWeight: '700',
    textAlign: 'center', marginTop: spacing.lg,
  },
});
