import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { haptic } from '../../../src/lib/haptics';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useAuth } from '../../../src/stores/auth';
import { toast } from '../../../src/lib/toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 12;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
// Header ~60px + tab bar ~84px (iOS) / ~64px (web) + safe area ~50px = ~194px overhead
const TAB_BAR_H = Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 64 : 62;
const HEADER_H = 60;
const SAFE_AREA_TOP = Platform.OS === 'ios' ? 50 : 0;
const ROWS = 7; // 13 tiles = 7 rows (last row has 1)
const AVAILABLE_H = SCREEN_HEIGHT - HEADER_H - TAB_BAR_H - SAFE_AREA_TOP - GRID_PADDING * 2;
const TILE_HEIGHT = Math.floor((AVAILABLE_H - GRID_GAP * (ROWS - 1)) / ROWS);

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
    title: 'Pass & Stamps',
    route: '/(tabs)/me/passes',
    accent: colors.amber,
    bgTint: `${colors.amber}12`,
  },
  {
    icon: 'compass',
    title: 'The Ways',
    route: '/(tabs)/more/ways',
    accent: '#2D6A4F',
    bgTint: 'rgba(45,106,79,0.08)',
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
    icon: 'ribbon',
    title: 'Verification',
    route: '/(tabs)/more/verification',
    accent: '#22863A',
    bgTint: 'rgba(34,134,58,0.08)',
  },
  {
    icon: 'shield-checkmark',
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

export default function MoreScreen() {
  const { user, isLoading } = useAuthGuard();
  const { signOut } = useAuth();
  if (isLoading) return null;

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out');
      router.replace('/(auth)/login' as any);
    } catch {
      toast.error('Could not sign out');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabelText}>MORE</Text>
        </View>
        <Text style={styles.headerTitle}>Everything Else</Text>
      </View>

      <View style={styles.grid}>
        {appTiles.map((tile) => (
          <TouchableOpacity
            key={tile.route + tile.title}
            style={[styles.tile, tile.bgTint ? { backgroundColor: tile.bgTint } : null]}
            onPress={() => { haptic.light(); router.push(tile.route as any); }}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: `${tile.accent || colors.ink3}15` }]}>
              <Ionicons
                name={tile.icon as any}
                size={20}
                color={tile.accent ?? colors.ink2}
              />
            </View>
            <Text style={[styles.tileTitle, tile.accent ? { color: tile.accent } : null]} numberOfLines={2}>
              {tile.title}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Logout tile — always last */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: 'rgba(192,57,43,0.06)' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(192,57,43,0.12)' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
          </View>
          <Text style={[styles.tileTitle, { color: colors.red }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 8,
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
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
});
