import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PS-06: Horizontal Swiping Between Passes
 *
 * Swipe left/right to navigate between all 4 passes.
 * Dot indicators show current position. Each pass card links to its full view.
 */

const PASSES = [
  {
    id: 'wanderkind',
    title: 'Wanderkind Pass',
    subtitle: 'Your official walking credential',
    icon: 'medal' as const,
    color: '#D4A017',
    bg: '#D4A01712',
    route: '/(tabs)/me/pass/wanderkind',
  },
  {
    id: 'food',
    title: 'Food Pass',
    subtitle: 'Meals shared & received',
    icon: 'restaurant' as const,
    color: '#C8762A',
    bg: '#C8762A12',
    route: '/(tabs)/me/pass/food',
  },
  {
    id: 'hospitality',
    title: 'Hospitality Pass',
    subtitle: 'Nights hosted & welcomed',
    icon: 'bed' as const,
    color: '#6B4226',
    bg: '#6B422612',
    route: '/(tabs)/me/pass/hospitality',
  },
  {
    id: 'water',
    title: 'Water Pass',
    subtitle: 'Water sources shared',
    icon: 'water' as const,
    color: '#2E6DA4',
    bg: '#2E6DA412',
    route: '/(tabs)/me/pass/water',
  },
];

export default function PassesScreen() {
  useAuthGuard();

  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    if (idx !== activeIndex && idx >= 0 && idx < PASSES.length) {
      setActiveIndex(idx);
    }
  };

  const goToPass = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
    setActiveIndex(idx);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>YOUR PASSES</Text>
          <Text style={styles.headerTitle}>{PASSES[activeIndex].title}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {PASSES.map((pass, idx) => (
          <TouchableOpacity key={pass.id} onPress={() => goToPass(idx)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <View style={[
              styles.dot,
              { backgroundColor: idx === activeIndex ? pass.color : colors.border },
              idx === activeIndex && styles.dotActive,
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontal paging */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.pager}
      >
        {PASSES.map((pass) => (
          <TouchableOpacity
            key={pass.id}
            style={[styles.passPage, { width: SCREEN_WIDTH }]}
            activeOpacity={0.85}
            onPress={() => router.push(pass.route as any)}
          >
            <View style={styles.passCard}>
              {/* Pass face */}
              <View style={[styles.passTop, { backgroundColor: pass.bg }]}>
                <View style={[styles.passIconCircle, { backgroundColor: `${pass.color}20` }]}>
                  <Ionicons name={pass.icon} size={48} color={pass.color} />
                </View>
                <Text style={[styles.passTitle, { color: pass.color }]}>{pass.title}</Text>
                <Text style={styles.passSubtitle}>{pass.subtitle}</Text>
              </View>

              {/* Pass body */}
              <View style={styles.passBody}>
                <View style={styles.passDetail}>
                  <Text style={styles.detailLabel}>ISSUER</Text>
                  <Text style={styles.detailValue}>Wanderkind Embassy</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.passDetail}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <Text style={[styles.detailValue, { color: pass.color }]}>ACTIVE</Text>
                </View>
              </View>

              {/* Tap hint */}
              <View style={styles.tapHint}>
                <Ionicons name="open-outline" size={14} color={colors.ink3} />
                <Text style={styles.tapHintText}>Tap to view full pass</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Ionicons name="swap-horizontal-outline" size={14} color={colors.ink3} />
        <Text style={styles.swipeHintText}>Swipe to browse passes</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },

  pager: { flex: 1 },
  passPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  passCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  passTop: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  passIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  passTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passSubtitle: {
    fontSize: 12,
    color: colors.ink2,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  passBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  passDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.ink3,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLt,
  },
  tapHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  tapHintText: {
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.5,
  },

  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  swipeHintText: {
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.5,
  },
});
