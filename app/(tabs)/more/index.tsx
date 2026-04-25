import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  accent?: string;
};

const menuItems: MenuItem[] = [
  {
    icon: 'home-outline',
    title: 'WanderHost',
    subtitle: 'Your hosting home, guestbook & project',
    route: '/(tabs)/more/wanderhost',
    accent: colors.amber,
  },
  {
    icon: 'trail-sign-outline',
    title: 'Ways',
    subtitle: 'Discover walking routes across Europe',
    route: '/(tabs)/more/ways',
  },
  {
    icon: 'ribbon-outline',
    title: 'The Wanderkind Way',
    subtitle: 'Your journey, tiers & progression',
    route: '/(tabs)/more/wanderkind-way',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verification',
    subtitle: 'Verify your identity for trust & safety',
    route: '/(tabs)/more/verification',
  },
  {
    icon: 'shield-outline',
    title: 'Privacy & Blocking',
    subtitle: 'Privacy settings and blocked users',
    route: '/(tabs)/more/privacy',
  },
  {
    icon: 'document-text-outline',
    title: 'Passes',
    subtitle: 'Your credentials and passes',
    route: '/(tabs)/me/passes',
    accent: colors.amber,
  },
  {
    icon: 'grid-outline',
    title: 'Stamps',
    subtitle: 'Your artisanal stamp collection',
    route: '/(tabs)/more/stamps',
  },
  {
    icon: 'journal-outline',
    title: 'Journal',
    subtitle: 'Journal, blog & book — your stories',
    route: '/(tabs)/more/book',
  },
  {
    icon: 'bag-outline',
    title: 'Packlist',
    subtitle: 'Your interactive walking packlist',
    route: '/(tabs)/more/packlist',
  },
  {
    icon: 'people-outline',
    title: 'Group Walk',
    subtitle: 'Walk together with others',
    route: '/(tabs)/more/group-walk',
  },
  {
    icon: 'thumbs-up-outline',
    title: 'Hitch Hike',
    subtitle: 'Hitchhike safely between stages',
    route: '/(tabs)/map/tramp-mode',
    accent: colors.green,
  },
  {
    icon: 'information-circle-outline',
    title: 'About',
    subtitle: 'About Wanderkind',
    route: '/(tabs)/more/about',
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
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, item.accent && { backgroundColor: `${item.accent}12` }]}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.accent ?? colors.ink2}
              />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </TouchableOpacity>
        ))}

        {/* Emergency SOS */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={() => router.push('/(tabs)/more/emergency' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.sosIcon}>
            <Ionicons name="warning-outline" size={20} color={colors.red} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.red }]}>Emergency SOS</Text>
            <Text style={styles.menuSubtitle}>Safety tools and emergency contacts</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.red} />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 16 }]}
          onPress={() => router.push('/(tabs)/more/settings' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="settings-outline" size={20} color={colors.ink2} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Settings</Text>
            <Text style={styles.menuSubtitle}>Language, notifications, privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
        </TouchableOpacity>
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
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  list: {
    padding: spacing.lg,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.ink3,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redBg,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(176,58,58,0.15)',
    marginTop: 8,
  },
  sosIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.redBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
