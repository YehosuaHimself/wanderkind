import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions,
  FlatList, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PADDING = 14;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const TAB_BAR_H = Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 64 : 62;
const HEADER_H = 68;
const SAFE_AREA_TOP = Platform.OS === 'ios' ? 50 : 0;
const DOTS_H = 32;
const AVAILABLE_H = SCREEN_HEIGHT - HEADER_H - TAB_BAR_H - SAFE_AREA_TOP - GRID_PADDING * 2 - DOTS_H;

type AppTile = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  route: string;
  accent?: string;
  bgTint?: string;
};

// PAGE 1: Core features — identity, credentials, journey
const page1Tiles: AppTile[] = [
  {
    icon: 'home',
    title: 'WanderHost',
    route: '/(tabs)/more/wanderhost',
    accent: colors.amber,
    bgTint: `${colors.amber}12`,
  },
  {
    icon: 'document-text',
    title: 'Wanderkind Pass',
    route: '/(tabs)/more/passes',
    accent: colors.amber,
    bgTint: `${colors.amber}12`,
  },
  {
    icon: 'footsteps',
    title: 'Wanderkind Journey',
    route: '/(tabs)/more/journey',
    accent: '#2D6A4F',
    bgTint: 'rgba(45,106,79,0.08)',
  },
  {
    icon: 'ribbon',
    title: 'Stamps & Visas',
    route: '/(tabs)/more/stamps',
    accent: '#6B21A8',
    bgTint: 'rgba(107,33,168,0.06)',
  },
  {
    icon: 'bag-check',
    title: 'Packlist & Tips',
    route: '/(tabs)/more/packlist',
    accent: colors.green,
    bgTint: `${colors.green}12`,
  },
  {
    icon: 'create',
    title: 'Write',
    route: '/(tabs)/more/book',
    accent: colors.ink2,
  },
];

// PAGE 2: Safety, verification, admin
const page2Tiles: AppTile[] = [
  {
    icon: 'shield-checkmark',
    title: 'Verification',
    route: '/(tabs)/more/verification',
    accent: '#22863A',
    bgTint: 'rgba(34,134,58,0.08)',
  },
  {
    icon: 'warning',
    title: 'Emergency & Contacts',
    route: '/(tabs)/more/emergency',
    accent: colors.red,
    bgTint: colors.redBg,
  },
  {
    icon: 'settings',
    title: 'Trust & Settings',
    route: '/(tabs)/more/settings',
    accent: colors.ink2,
  },
  {
    icon: 'business',
    title: 'Org Login',
    route: '/(tabs)/more/org-login',
    accent: '#6B21A8',
    bgTint: 'rgba(107,33,168,0.06)',
  },
  {
    icon: 'information-circle',
    title: 'About',
    route: '/(tabs)/more/about',
    accent: colors.ink3,
  },
];

const PAGES = [
  { key: 'features', label: 'WANDERKIND', tiles: page1Tiles },
  { key: 'settings', label: 'SETTINGS & ADMIN', tiles: page2Tiles },
];

export default function MoreScreen() {
  const { user, isLoading } = useAuthGuard();
  const [activePage, setActivePage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  if (isLoading) return null;

  const router = useRouter();
  const ROWS_PER_PAGE = 3;
  const TILE_HEIGHT = Math.floor((AVAILABLE_H - GRID_GAP * (ROWS_PER_PAGE - 1)) / ROWS_PER_PAGE);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePage(page);
  }, []);

  const renderPage = useCallback(({ item }: { item: typeof PAGES[0] }) => (
    <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
      <View style={styles.grid}>
        {item.tiles.map((tile) => (
          <TouchableOpacity
            key={tile.route + tile.title}
            style={[styles.tile, { height: TILE_HEIGHT }, tile.bgTint ? { backgroundColor: tile.bgTint } : null]}
            onPress={() => { haptic.light(); router.push(tile.route as any); }}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: `${tile.accent || colors.ink3}15` }]}>
              <Ionicons name={tile.icon as any} size={22} color={tile.accent ?? colors.ink2} />
            </View>
            <Text style={[styles.tileTitle, tile.accent ? { color: tile.accent } : null]} numberOfLines={2}>
              {tile.title}
            </Text>
          </TouchableOpacity>
        ))}

      </View>
    </View>
  ), [router, TILE_HEIGHT]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with title + page label */}
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MORE</Text>
        </View>
        <Text style={styles.headerTitle}>{PAGES[activePage].label}</Text>
      </View>

      {/* Swipeable pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.pager}
      />

      {/* Nav dots */}
      <View style={styles.dotsRow}>
        {PAGES.map((page, i) => (
          <TouchableOpacity
            key={page.key}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActivePage(i);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.dot, activePage === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: GRID_PADDING,
    paddingVertical: GRID_PADDING,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: DOTS_H,
    paddingBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.amber,
    width: 20,
    borderRadius: 4,
  },
});
