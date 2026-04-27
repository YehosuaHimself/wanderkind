import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

type Member = {
  id: string;
  name: string;
  avatar: string;
  tier: string;
};

export default function GroupWalkDetailScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const router = useRouter();
  const { id } = useLocalSearchParams();

  const mockMembers: Member[] = [
    { id: '1', name: 'Maria', avatar: 'M', tier: 'wandersmann' },
    { id: '2', name: 'Hans', avatar: 'H', tier: 'pilger' },
    { id: '3', name: 'Sophie', avatar: 'S', tier: 'wanderkind' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Group Walk Details" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        <WKCard variant="gold" style={{ marginBottom: spacing.xl }}>
          <View style={styles.heroSection}>
            <View style={styles.routeIcon}>
              <Ionicons name="trail-sign-outline" size={32} color={colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h2, styles.title]}>
                Camino del Norte
              </Text>
              <Text style={[typography.bodySm, styles.subtitle]}>
                Created by Maria
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>450 km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>8/12</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>15 May</Text>
              <Text style={styles.statLabel}>Start Date</Text>
            </View>
          </View>
        </WKCard>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>About This Walk</Text>
          <WKCard>
            <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
              Join us on the scenic Camino del Norte route, walking together through northern Spain. We'll stay at designated albergues and have scheduled rest days.
            </Text>
          </WKCard>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Members ({mockMembers.length})</Text>
          <View style={styles.membersList}>
            {mockMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>{member.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberTier}>{member.tier}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <WKButton
            title="Group Chat"
            onPress={() => {}}
            variant="secondary"
            fullWidth
            icon={<Ionicons name="chatbubble-outline" size={16} color={colors.amber} />}
          />
          <WKButton
            title="Leave Group"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  routeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(200,118,42,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: colors.ink },
  subtitle: { color: colors.ink3, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,118,42,0.15)',
  },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.amber },
  statLabel: { ...typography.caption, color: colors.ink3, marginTop: 4 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.ink, marginBottom: spacing.md },
  membersList: { gap: spacing.sm },
  memberCard: {
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
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.surface, fontWeight: '600', fontSize: 16 },
  memberName: { ...typography.body, color: colors.ink, fontWeight: '600' },
  memberTier: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
});
