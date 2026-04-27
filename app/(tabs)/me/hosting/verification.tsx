import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const VERIFICATION_LEVELS = [
  {
    id: 'self',
    name: 'Self Verified',
    color: colors.ink3,
    description: 'You created your profile',
    requirements: ['Create account', 'Add photos', 'Write description'],
    completed: true,
  },
  {
    id: 'community',
    name: 'Community Verified',
    color: colors.amber,
    description: 'Verified by fellow walkers',
    requirements: ['3+ positive reviews', 'Hosted 5+ guests', 'Active for 3+ months'],
    completed: true,
  },
  {
    id: 'association',
    name: 'Association Verified',
    color: colors.gold,
    description: 'Recognized by local association',
    requirements: ['Association membership', 'Inspection passed', 'Community verified'],
    completed: false,
  },
  {
    id: 'wanderkind',
    name: 'Wanderkind Verified',
    color: colors.green,
    description: 'Official Wanderkind endorsement',
    requirements: ['Association verified', 'Premium rating', 'Special approval'],
    completed: false,
  },
];

function VerificationBadge({
  level,
  isActive,
}: {
  level: (typeof VERIFICATION_LEVELS)[0];
  isActive: boolean;
}) {
  return (
    <View style={[styles.badgeContainer, !isActive && styles.badgeInactive]}>
      <View
        style={[
          styles.badgeCircle,
          { backgroundColor: level.color },
          !isActive && styles.badgeCircleInactive,
        ]}
      >
        {isActive ? (
          <Ionicons name="checkmark" size={20} color={colors.surface} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={colors.surface} />
        )}
      </View>
      <View style={styles.badgeText}>
        <Text style={[styles.badgeName, !isActive && styles.badgeNameInactive]}>
          {level.name}
        </Text>
        <Text
          style={[
            styles.badgeDescription,
            !isActive && styles.badgeDescriptionInactive,
          ]}
        >
          {level.description}
        </Text>
      </View>
    </View>
  );
}

export default function VerificationScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const currentLevel = 2; // Community verified

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Host Verification" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress Overview */}
          <WKCard variant="parchment">
            <View style={styles.progressHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.amber} />
              <View style={styles.progressText}>
                <Text style={styles.progressTitle}>Your Status</Text>
                <Text style={styles.progressSubtitle}>
                  {VERIFICATION_LEVELS[currentLevel].name}
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentLevel + 1) / VERIFICATION_LEVELS.length) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              Level {currentLevel + 1} of {VERIFICATION_LEVELS.length}
            </Text>
          </WKCard>

          {/* Verification Levels */}
          {VERIFICATION_LEVELS.map((level, idx) => (
            <WKCard key={level.id} style={styles.levelCard}>
              <VerificationBadge
                level={level}
                isActive={idx <= currentLevel}
              />

              {/* Requirements */}
              <View style={styles.requirementsList}>
                {level.requirements.map((req, reqIdx) => (
                  <View key={reqIdx} style={styles.requirement}>
                    <Ionicons
                      name={
                        idx <= currentLevel ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={18}
                      color={
                        idx <= currentLevel ? colors.green : colors.ink3
                      }
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        idx > currentLevel && styles.requirementTextInactive,
                      ]}
                    >
                      {req}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {idx === currentLevel + 1 && (
                <WKButton
                  title={`Complete ${level.name}`}
                  onPress={() => {}}
                  variant="outline"
                  fullWidth
                  style={styles.actionBtn}
                />
              )}
            </WKCard>
          ))}

          {/* Benefits Card */}
          <WKCard variant="gold">
            <View style={styles.benefitsHeader}>
              <Ionicons name="star" size={20} color={colors.amber} />
              <Text style={styles.benefitsTitle}>Why Verify?</Text>
            </View>
            <View style={styles.benefitsList}>
              <Text style={styles.benefit}>
                More bookings from verified walkers
              </Text>
              <Text style={styles.benefit}>
                Higher visibility on the map
              </Text>
              <Text style={styles.benefit}>
                Access to host community features
              </Text>
              <Text style={styles.benefit}>
                Build trust with your guests
              </Text>
            </View>
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  progressSubtitle: {
    ...typography.h3,
    color: colors.ink,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  progressLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
  },
  levelCard: {
    gap: spacing.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  badgeInactive: {
    opacity: 0.6,
  },
  badgeCircle: {
    width: 50,
    height: 50,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeCircleInactive: {
    backgroundColor: colors.ink3,
  },
  badgeText: {
    flex: 1,
    gap: spacing.xs,
  },
  badgeName: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  badgeNameInactive: {
    color: colors.ink2,
  },
  badgeDescription: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  badgeDescriptionInactive: {
    color: colors.ink3,
  },
  requirementsList: {
    gap: spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  requirementText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  requirementTextInactive: {
    color: colors.ink3,
  },
  actionBtn: {
    marginTop: spacing.md,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  benefitsTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  benefitsList: {
    gap: spacing.md,
  },
  benefit: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
});
