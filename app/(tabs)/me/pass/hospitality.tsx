import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

export default function HospitalityPassScreen() {
  const { profile } = useAuth();
  const nightsHosted = profile?.nights_hosted ?? 0;
  const guestsWelcomed = profile?.guests_count ?? 0;
  const hostingRating = profile?.hosting_rating ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Hospitality Pass" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Main Stats */}
        <WKCard variant="gold" style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.mainValue}>{nightsHosted}</Text>
            <Text style={styles.mainLabel}>NIGHTS HOSTED</Text>
          </View>
        </WKCard>

        {/* Secondary Stats */}
        <WKCard style={styles.secondaryCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons name="people" size={24} color={colors.passHosp} />
              <Text style={styles.statValue}>{guestsWelcomed}</Text>
              <Text style={styles.statLabel}>GUESTS</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Ionicons name="star" size={24} color={colors.gold} />
              <Text style={styles.statValue}>{hostingRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </View>
          </View>
        </WKCard>

        {/* Description */}
        <WKCard>
          <Text style={styles.title}>Your Hosting Impact</Text>
          <Text style={styles.description}>
            The Hospitality Pass recognizes your commitment to welcoming wanderers into your home. Each night hosted is a night of human connection and community building.
          </Text>
        </WKCard>

        {/* Hosting Stats */}
        <WKCard>
          <Text style={styles.title}>Hosting Profile</Text>
          <View style={styles.statsList}>
            <View style={styles.infoRow}>
              <Ionicons name="home" size={16} color={colors.passHosp} />
              <Text style={styles.infoLabel}>Space Available</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.green} />
              <Text style={styles.infoLabel}>Verified Host</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={16} color={colors.passHosp} />
              <Text style={styles.infoLabel}>Community Trust</Text>
              <Text style={styles.infoValue}>High</Text>
            </View>
          </View>
        </WKCard>

        {/* Benefits */}
        <WKCard>
          <Text style={styles.title}>Hosting Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={18} color={colors.passHosp} />
              <Text style={styles.benefitText}>Higher visibility on map</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={18} color={colors.passHosp} />
              <Text style={styles.benefitText}>Verified host badge</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={18} color={colors.passHosp} />
              <Text style={styles.benefitText}>Community recognition</Text>
            </View>
          </View>
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  mainStat: {
    alignItems: 'center',
  },
  mainValue: {
    ...typography.display,
    color: colors.passHosp,
  },
  mainLabel: {
    ...typography.bodySm,
    color: colors.gold,
    marginTop: spacing.md,
    letterSpacing: 1,
    fontWeight: '600',
  },
  secondaryCard: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.passHosp,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: colors.borderLt,
  },
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  statsList: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    color: colors.ink2,
    flex: 1,
  },
  infoValue: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  benefitsList: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitText: {
    ...typography.body,
    color: colors.ink2,
  },
});
