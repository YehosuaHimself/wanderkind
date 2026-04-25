import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function AboutScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [founderOpen, setFounderOpen] = useState(false);

  const openURL = (url: string) => Linking.openURL(url);

  const links = [
    { label: 'Terms of Service', route: '/(tabs)/more/legal/terms' },
    { label: 'Privacy Policy', route: '/(tabs)/more/legal/privacy-policy' },
    { label: 'Legal Imprint', route: '/(tabs)/more/legal/imprint' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="About WANDERKIND" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logo}>W</Text>
          </View>
          <Text style={[typography.h2, styles.appName]}>WANDERKIND</Text>
          <Text style={styles.version}>KINGS WAY EDITION</Text>
        </View>

        {/* Mission Statement */}
        <WKCard variant="parchment" style={styles.missionCard}>
          <Text style={[typography.h3, { color: colors.ink, marginBottom: spacing.md }]}>Our Mission</Text>
          <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
            To revive the ancient tradition of walking for modern wanderers, connecting communities across Europe through walking, hospitality, and shared human connection.
          </Text>
        </WKCard>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Built For</Text>
          <View style={styles.featureList}>
            {[
              { icon: 'walk-outline', text: 'Long-distance walkers and wanderers' },
              { icon: 'home-outline', text: 'Hosts opening their doors' },
              { icon: 'people-outline', text: 'Connected communities' },
            ].map((item, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={item.icon as any} size={16} color={colors.amber} />
                </View>
                <Text style={[typography.body, styles.featureText]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Team</Text>
          <WKCard>
            <Text style={[typography.body, { color: colors.ink2 }]}>
              WANDERKIND is built by a global community of walkers, developers, and hospitality hosts.
            </Text>
          </WKCard>
        </View>

        {/* Message from the Founder */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.founderButton}
            onPress={() => setFounderOpen(!founderOpen)}
            activeOpacity={0.7}
          >
            <Ionicons name={founderOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.amber} />
            <Text style={styles.founderButtonText}>MESSAGE FROM THE FOUNDER</Text>
          </TouchableOpacity>
          {founderOpen && (
            <WKCard variant="parchment" style={{ marginTop: spacing.md }}>
              <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
                It's me Yehosua.{'\n\n'}I created WANDERKIND.{'\n\n'}On first of January 2025, I started my own way from Berchtesgaden, and went to Tarifa by foot and back. As I enjoyed the experience, I continued up north to Copenhagen, and back. And as I still enjoyed the experience, I went to Rome, and back. And as I still enjoyed the experience, I am still walking, and just arrived in Antwerpen. I created WANDERKIND on the road for all those who enjoy the experience of walking too, and at times appreciate to struggle a bit less with the routines of wandering the world.{'\n\n'}I run WANDERKIND alone, and have no commercial interest whatsoever. Should You enjoy however supporting the WANDERKIND idea, feel free to contribute or send me a message.
              </Text>
              <View style={styles.founderActions}>
                <TouchableOpacity
                  style={styles.founderCta}
                  onPress={() => router.push('/(tabs)/more/feedback' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.founderCtaText}>MESSAGE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.founderCtaContribute}
                  onPress={() => Linking.openURL('https://paypal.me/YehosuaHimself')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart" size={14} color="#8B1A1A" />
                  <Text style={styles.founderCtaContributeText}>CONTRIBUTE</Text>
                </TouchableOpacity>
              </View>
            </WKCard>
          )}
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Legal</Text>
          <View style={styles.linkList}>
            {links.map((link, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.linkButton}
                onPress={() => router.push(link.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contribute Section */}
        <View style={styles.section}>
          <WKButton
            title="Support WANDERKIND"
            onPress={() => router.push('/(tabs)/more/contribute' as any)}
            variant="primary"
            fullWidth
          />
          <WKButton
            title="Send Feedback"
            onPress={() => router.push('/(tabs)/more/feedback' as any)}
            variant="outline"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Made with love for wanderers everywhere.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 48,
    color: colors.surface,
    fontWeight: '900',
  },
  appName: { color: colors.ink, marginBottom: spacing.sm },
  version: { color: colors.ink3, ...typography.bodySm },
  missionCard: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.ink, marginBottom: spacing.md },
  featureList: { gap: spacing.md },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { flex: 1, color: colors.ink2 },
  linkList: { gap: spacing.sm },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  linkText: { ...typography.body, color: colors.amber, flex: 1 },
  founderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  founderButtonText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.amber,
  },
  founderActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  founderCta: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  founderCtaText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#fff',
  },
  founderCtaContribute: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  founderCtaContributeText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8B1A1A',
  },
  footer: {
    textAlign: 'center',
    color: colors.ink3,
    ...typography.bodySm,
    marginTop: spacing.xl,
  },
});
