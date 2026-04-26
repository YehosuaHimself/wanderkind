import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

/**
 * DR-09: SELF Verification — Clear Meaning & Upgrade Path
 *
 * Four verification levels with concrete requirements:
 * 1. Self-Declared: profile photo + bio + real name
 * 2. Community: 3+ stamps from different hosts
 * 3. Association: endorsed by a pilgrimage confraternity or trail org
 * 4. Wanderkind: personal verification by the Wanderkind team
 */

type LevelId = 'self' | 'community' | 'association' | 'wanderkind';

interface VerificationLevelConfig {
  id: LevelId;
  label: string;
  displayName: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  requirements: string[];
  description: string;
}

const LEVELS: VerificationLevelConfig[] = [
  {
    id: 'self',
    label: 'SELF-DECLARED',
    displayName: 'Self-Declared',
    icon: 'person-circle-outline',
    color: '#C8762A',
    bg: '#C8762A12',
    description: "You've completed your profile with real information and a photo.",
    requirements: [
      'Profile photo uploaded',
      'Real name (trail name) set',
      'Bio written (at least 20 characters)',
    ],
  },
  {
    id: 'community',
    label: 'COMMUNITY',
    displayName: 'Community Verified',
    icon: 'people-circle-outline',
    color: '#22863A',
    bg: '#22863A12',
    description: 'Other hosts and walkers have confirmed your identity through real-world encounters.',
    requirements: [
      '3+ stamps from different hosts',
      'At least 3 nights walked',
      'No reports or warnings on file',
    ],
  },
  {
    id: 'association',
    label: 'ASSOCIATION',
    displayName: 'Association Endorsed',
    icon: 'ribbon-outline',
    color: '#6B21A8',
    bg: '#6B21A812',
    description: 'Endorsed by a pilgrimage confraternity, trail organization, or walking association.',
    requirements: [
      'Member of a recognized confraternity',
      'Endorsed by trail organization',
      'Active in organized walking community',
    ],
  },
  {
    id: 'wanderkind',
    label: 'WANDERKIND',
    displayName: 'Wanderkind Verified',
    icon: 'shield-checkmark',
    color: '#D4A017',
    bg: '#D4A01715',
    description: 'Personally verified by the Wanderkind team — the highest level of trust.',
    requirements: [
      'Personal verification by Wanderkind team',
      'In-person or video identity confirmation',
      'Long-standing community member',
    ],
  },
];

const LEVEL_ORDER: LevelId[] = ['self', 'community', 'association', 'wanderkind'];

export default function VerificationScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const { profile } = useAuth();
  const currentLevel = (profile?.verification_level as LevelId) ?? 'self';
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);

  // Calculate which requirements are "met" for current user (simplified check)
  const hasPhoto = !!profile?.avatar_url;
  const hasName = !!profile?.trail_name && profile.trail_name.length > 1;
  const hasBio = !!profile?.bio && profile.bio.length >= 20;
  const selfMet = [hasPhoto, hasName, hasBio];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>TRUST & SAFETY</Text>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Level Card */}
        <View style={styles.currentCard}>
          <View style={styles.currentTop}>
            <Ionicons
              name={LEVELS[currentIdx]?.icon ?? 'shield-checkmark'}
              size={36}
              color={LEVELS[currentIdx]?.color ?? colors.amber}
            />
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>YOUR LEVEL</Text>
              <Text style={[styles.currentName, { color: LEVELS[currentIdx]?.color ?? colors.amber }]}>
                {LEVELS[currentIdx]?.displayName ?? 'Self-Declared'}
              </Text>
            </View>
          </View>
          <Text style={styles.currentDesc}>
            {LEVELS[currentIdx]?.description ?? ''}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            {LEVEL_ORDER.map((lvl, i) => {
              const reached = i <= currentIdx;
              const lvlConfig = LEVELS[i];
              return (
                <View key={lvl} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    reached && { backgroundColor: lvlConfig.color },
                  ]}>
                    {reached && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.progressLabel, reached && { color: lvlConfig.color }]}>
                    {lvl === 'self' ? 'Self' : lvl === 'community' ? 'Comm' : lvl === 'association' ? 'Assoc' : 'WK'}
                  </Text>
                  {i < LEVEL_ORDER.length - 1 && (
                    <View style={[styles.progressLine, reached && { backgroundColor: lvlConfig.color }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* All Levels */}
        {LEVELS.map((level, idx) => {
          const isReached = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isNext = idx === currentIdx + 1;

          return (
            <View
              key={level.id}
              style={[
                styles.levelCard,
                isCurrent && { borderColor: level.color, borderWidth: 1.5 },
                !isReached && !isNext && styles.levelLocked,
              ]}
            >
              <View style={styles.levelHeader}>
                <View style={[styles.levelIcon, { backgroundColor: level.bg }]}>
                  <Ionicons name={level.icon} size={22} color={level.color} />
                </View>
                <View style={styles.levelInfo}>
                  <View style={styles.levelNameRow}>
                    <Text style={[styles.levelName, { color: isReached ? level.color : colors.ink3 }]}>
                      {level.displayName}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.youBadge, { backgroundColor: level.color }]}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                    {isReached && !isCurrent && (
                      <Ionicons name="checkmark-circle" size={16} color={level.color} />
                    )}
                    {!isReached && (
                      <Ionicons name="lock-closed-outline" size={14} color={colors.ink3} />
                    )}
                  </View>
                  <Text style={styles.levelDesc}>{level.description}</Text>
                </View>
              </View>

              {/* Requirements checklist */}
              <View style={styles.reqList}>
                {level.requirements.map((req, ri) => {
                  // For self-declared, show actual completion status
                  const met = level.id === 'self' ? selfMet[ri] : isReached;
                  return (
                    <View key={ri} style={styles.reqRow}>
                      <Ionicons
                        name={met ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={met ? level.color : colors.ink3}
                      />
                      <Text style={[styles.reqText, met && { color: colors.ink }]}>{req}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.tipText}>
            Each verification level builds trust within the community. Walk more, collect stamps from hosts, and your trust grows naturally.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  scrollContent: { padding: spacing.lg },

  // Current level card
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 20,
  },
  currentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  currentInfo: { flex: 1 },
  currentLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
  },
  currentName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  currentDesc: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
    marginBottom: 14,
  },

  // Progress bar
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.ink3,
  },
  progressLine: {
    position: 'absolute',
    top: 10,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },

  // Level cards
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 10,
  },
  levelLocked: {
    opacity: 0.45,
  },
  levelHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  levelIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInfo: { flex: 1 },
  levelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  levelDesc: {
    fontSize: 12,
    color: colors.ink3,
    lineHeight: 16,
  },
  youBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },

  // Requirements
  reqList: {
    gap: 6,
    paddingLeft: 54,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqText: {
    fontSize: 12,
    color: colors.ink3,
    flex: 1,
  },

  // Tip card
  tipCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.amber}10`,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 6,
  },
  tipText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 18,
  },
});
