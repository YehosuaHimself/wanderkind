import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PADDING = 16;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type AppTile = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  route: string;
  accent?: string;
  bgTint?: string;
};

const appTiles: AppTile[] = [
  {
    icon: 'home',
    title: 'WanderHost',
    route: '/(tabs)/more/wanderhost',
    accent: colors.amber,
    bgTint: `${colors.amber}12`,
  },
  {
    icon: 'document-text',
    title: 'Passes',
    route: '/(tabs)/me/passes',
    accent: colors.amber,
    bgTint: `${colors.amber}12`,
  },
  {
    icon: 'ribbon',
    title: 'Stamps',
    route: '/(tabs)/more/stamps',
    accent: '#8B5E3C',
    bgTint: 'rgba(139,94,60,0.08)',
  },
  {
    icon: 'create',
    title: 'Writing',
    route: '/(tabs)/more/book',
    accent: colors.ink2,
  },
  {
    icon: 'bag-check',
    title: 'Packlist & Tips',
    route: '/(tabs)/more/packlist',
    accent: colors.green,
    bgTint: `${colors.green}12`,
  },
  {
    icon: 'thumbs-up',
    title: 'Hitchhike',
    route: '/(tabs)/map/tramp-mode',
    accent: '#E67E22',
    bgTint: 'rgba(230,126,34,0.08)',
  },
  {
    icon: 'people',
    title: 'WanderGroups',
    route: '/(tabs)/more/group-walk',
    accent: colors.blue,
    bgTint: `${colors.blue}12`,
  },
  {
    icon: 'warning',
    title: 'Emergency & Contacts',
    route: '/(tabs)/more/emergency',
    accent: colors.red,
    bgTint: colors.redBg,
  },
  {
    icon: 'shield-checkmark',
    title: 'Trust & Settings',
    route: '/(tabs)/more/settings',
    accent: colors.ink2,
  },
  {
    icon: 'information-circle',
    title: 'About',
    route: '/(tabs)/more/about',
    accent: colors.ink3,
  },
];

export default function MoreScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MORE</Text>
        </View>
        <Text style={styles.headerTitle}>Everything Else</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {appTiles.map((tile) => (
          <TouchableOpacity
            key={tile.route + tile.title}
            style={[styles.tile, tile.bgTint ? { backgroundColor: tile.bgTint } : null]}
            onPress={() => router.push(tile.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: `${tile.accent || colors.ink3}15` }]}>
              <Ionicons
                name={tile.icon as any}
                size={24}
                color={tile.accent ?? colors.ink2}
              />
            </View>
            <Text style={[styles.tileTitle, tile.accent ? { color: tile.accent } : null]} numberOfLines={2}>
              {tile.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GRID_GAP,
    paddingBottom: 40,
  },
  tile: {
    width: TILE_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.3,
  },
});
