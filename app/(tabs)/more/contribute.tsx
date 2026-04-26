import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function ContributeScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const openPayPal = () => {
    Linking.openURL('https://paypal.me/YehosuaHimself');
  };

  const openEmail = () => {
    Linking.openURL('mailto:hallo@wanderkind.love');
  };

  const ways = [
    {
      icon: 'heart-outline' as const,
      title: 'Donate',
      subtitle: 'Help keep Wanderkind free for everyone',
    },
    {
      icon: 'code-outline' as const,
      title: 'Code',
      subtitle: 'Contribute on GitHub',
    },
    {
      icon: 'people-outline' as const,
      title: 'Host',
      subtitle: 'Open your doors to walkers',
    },
    {
      icon: 'megaphone-outline' as const,
      title: 'Spread the Word',
      subtitle: 'Tell your friends about Wanderkind',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Support Wanderkind" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission Card */}
        <WKCard variant="parchment" style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.h3, { color: colors.ink, marginBottom: spacing.md }]}>
            Help Us Grow
          </Text>
          <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
            Wanderkind is built by walkers, for walkers. Your support helps us keep the platform free and sustainable.
          </Text>
        </WKCard>

        {/* Ways to Contribute */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Ways to Help</Text>
          <View style={styles.waysList}>
            {ways.map((way, idx) => (
              <View key={idx} style={styles.wayCard}>
                <View style={styles.wayIcon}>
                  <Ionicons name={way.icon} size={20} color={colors.amber} />
                </View>
                <View style={styles.wayContent}>
                  <Text style={styles.wayTitle}>{way.title}</Text>
                  <Text style={styles.waySubtitle}>{way.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Donation Options */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Financial Support</Text>
          <Text style={[typography.bodySm, { color: colors.ink3, marginBottom: spacing.md }]}>
            Choose your preferred donation method:
          </Text>

          <WKButton
            title="Donate via PayPal"
            onPress={openPayPal}
            variant="primary"
            fullWidth
            icon={<Ionicons name="logo-paypal" size={16} color="#fff" />}
          />

          <WKCard style={{ marginTop: spacing.md }}>
            <Text style={[typography.body, { color: colors.ink, fontWeight: '600', marginBottom: spacing.sm }]}>
              Bank Transfer
            </Text>
            <View style={styles.bankInfo}>
              <View style={styles.bankLine}>
                <Text style={styles.bankLabel}>IBAN:</Text>
                <Text style={styles.bankValue}>CH1300767000T53965217</Text>
              </View>
            </View>
          </WKCard>
        </View>

        {/* Volunteer */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Volunteer With Us</Text>
          <WKCard>
            <Text style={[typography.body, { color: colors.ink2, lineHeight: 24, marginBottom: spacing.md }]}>
              We're looking for passionate volunteers to help moderate content, improve translations, test features, and connect with communities across Europe.
            </Text>
            <WKButton
              title="Get Involved"
              onPress={openEmail}
              variant="outline"
              fullWidth
              icon={<Ionicons name="mail-outline" size={16} color={colors.amber} />}
            />
          </WKCard>
        </View>

        {/* Impact */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Your Impact</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Walkers Supported', value: '50K+' },
              { label: 'Routes Mapped', value: '14' },
              { label: 'Hosts Verified', value: '2K+' },
            ].map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>FAQ</Text>
          <WKCard>
            <Text style={[typography.bodySm, { color: colors.ink, fontWeight: '600', marginBottom: spacing.md }]}>
              Is Wanderkind non-profit?
            </Text>
            <Text style={[typography.bodySm, { color: colors.ink2, marginBottom: spacing.lg }]}>
              Wanderkind is community-driven and transparent about funding. We operate sustainably through donations and corporate partnerships.
            </Text>
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.ink, marginBottom: spacing.md },
  waysList: { gap: spacing.sm },
  wayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: spacing.md,
  },
  wayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wayContent: { flex: 1 },
  wayTitle: { ...typography.body, color: colors.ink, fontWeight: '600', marginBottom: 2 },
  waySubtitle: { ...typography.bodySm, color: colors.ink3 },
  bankInfo: { gap: spacing.sm },
  bankLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  bankLabel: { ...typography.bodySm, color: colors.ink3, fontWeight: '600' },
  bankValue: { ...typography.bodySm, color: colors.ink, flex: 1, textAlign: 'right' },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.amberBg,
    borderRadius: 8,
  },
  statValue: { ...typography.h3, color: colors.amber },
  statLabel: { ...typography.caption, color: colors.amber, marginTop: spacing.sm, textAlign: 'center' },
});
