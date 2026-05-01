import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';
import { BiometricGate } from '../../../src/components/verification/BiometricGate';
import { useBiometricGate } from '../../../src/hooks/useBiometricGate';

/**
 * 3-STAGE VERIFICATION SYSTEM
 *
 * Stage 1: Email Verified → General access
 * Stage 2: Biometric Verification (FaceTec-style video selfie) → Unlocks Food Pass, Hospitality Pass, Water Pass
 * Stage 3: Document Verification (ID/passport upload) → Unlocks Wanderkind Pass generation + advanced features (door pins, etc.)
 */

type StageId = 'email' | 'biometric' | 'document';
type StageStatus = 'completed' | 'available' | 'locked' | 'pending';

interface VerificationStage {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  description: string;
  unlocks: string[];
  actionLabel: string;
}

const STAGES: VerificationStage[] = [
  {
    id: 'email',
    number: 1,
    title: 'Email Verified',
    subtitle: 'Basic identity',
    icon: 'mail-outline',
    color: '#22863A',
    bg: '#22863A12',
    description: 'Your email address has been confirmed. This gives you general access to the Wanderkind community.',
    unlocks: [
      'Browse the community map (read only)',
      'Explore Ways and plan your route',
      'View profiles and offerings',
      'Post moments and stories',
    ],
    actionLabel: 'Resend Verification Email',
  },
  {
    id: 'biometric',
    number: 2,
    title: 'Biometric Verification',
    subtitle: 'Face verification',
    icon: 'scan-outline',
    color: '#C8762A',
    bg: '#C8762A12',
    description: 'Record a short video selfie to prove you are a real person. Similar to identity checks on trusted platforms. Quick, private, and secure.',
    unlocks: [
      'Send and receive messages',
      'Request stays with Wanderhosts',
      'Food, Hospitality & Water Passes',
      'Share and receive door PINs',
      'Appear on the community map as a host',
    ],
    actionLabel: 'Start Video Selfie',
  },
  {
    id: 'document',
    number: 3,
    title: 'Document Verification',
    subtitle: 'ID or passport',
    icon: 'document-text-outline',
    color: '#6B21A8',
    bg: '#6B21A812',
    description: 'Upload a photo of your ID or passport. Our team reviews it manually — typically within 24 hours. Your document is encrypted and never shared.',
    unlocks: [
      'Wanderkind Pass generation',
      'Receive door pins from hosts',
      'Full sharing and credential features',
      'Maximum trust level in the community',
    ],
    actionLabel: 'Upload Document',
  },
];

function getStageStatus(stageId: StageId, verificationLevel: string): StageStatus {
  // Map profile verification_level to stage statuses
  // Levels: 'none' | 'email' | 'biometric' | 'biometric_pending' | 'document' | 'document_pending'
  switch (stageId) {
    case 'email':
      if (verificationLevel === 'none') return 'available';
      return 'completed';
    case 'biometric':
      if (verificationLevel === 'none' || verificationLevel === 'email') {
        return verificationLevel === 'email' ? 'available' : 'locked';
      }
      if (verificationLevel === 'biometric_pending') return 'pending';
      return 'completed';
    case 'document':
      if (['none', 'email', 'biometric_pending'].includes(verificationLevel)) return 'locked';
      if (verificationLevel === 'biometric') return 'available';
      if (verificationLevel === 'document_pending') return 'pending';
      return 'completed';
    default:
      return 'locked';
  }
}

export default function VerificationScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [processingStage, setProcessingStage] = useState<StageId | null>(null);
  const [showSelfieGate, setShowSelfieGate] = useState(false);
  const { isVerified: isBiometricVerified } = useBiometricGate();

  // Current verification level from profile
  const verificationLevel = (profile?.verification_level as string) ?? 'none';

  // Determine completed stage count for progress
  const completedCount = STAGES.filter(s => getStageStatus(s.id, verificationLevel) === 'completed').length;

  const handleStageAction = async (stage: VerificationStage) => {
    haptic.medium();
    setProcessingStage(stage.id);

    try {
      switch (stage.id) {
        case 'email':
          // Email is typically verified at signup; this would resend
          toast.success('Verification email sent — check your inbox');
          break;

        case 'biometric':
          setProcessingStage(null);
          setShowSelfieGate(true);
          return;  // BiometricGate handles the rest

        case 'document':
          // In production: launch camera/gallery for document photo
          // For now: simulate the upload
          await updateProfile({ verification_level: 'document_pending' });
          toast.success('Document uploaded — under review (typically 24h)');
          break;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setProcessingStage(null);
    }
  };

  if (showSelfieGate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(200,118,42,0.10)' }}>
          <TouchableOpacity onPress={() => setShowSelfieGate(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <BiometricGate
            action="access your passes"
            onVerified={() => { setShowSelfieGate(false); }}
            onDismiss={() => setShowSelfieGate(false)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>TRUST & SAFETY</Text>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Verification Progress</Text>
          <View style={styles.progressBar}>
            {STAGES.map((stage, i) => {
              const status = getStageStatus(stage.id, verificationLevel);
              const isCompleted = status === 'completed';
              const isPending = status === 'pending';
              return (
                <View key={stage.id} style={styles.progressStep}>
                  <View style={[
                    styles.progressCircle,
                    isCompleted && { backgroundColor: stage.color },
                    isPending && { backgroundColor: colors.amber, borderWidth: 0 },
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : isPending ? (
                      <Ionicons name="time-outline" size={14} color="#fff" />
                    ) : (
                      <Text style={styles.progressNumber}>{stage.number}</Text>
                    )}
                  </View>
                  {i < STAGES.length - 1 && (
                    <View style={[
                      styles.progressLine,
                      isCompleted && { backgroundColor: stage.color },
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
          <Text style={styles.progressSubtext}>
            {completedCount === 0 && 'Complete your first verification step to unlock features'}
            {completedCount === 1 && 'Email verified — biometric check unlocks your passes'}
            {completedCount === 2 && 'Almost there — document verification unlocks full access'}
            {completedCount === 3 && 'Fully verified — all features unlocked'}
          </Text>
        </View>

        {/* Stage Cards */}
        {STAGES.map((stage) => {
          const status = getStageStatus(stage.id, verificationLevel);
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';
          const isPending = status === 'pending';
          const isAvailable = status === 'available';

          return (
            <View
              key={stage.id}
              style={[
                styles.stageCard,
                isCompleted && { borderColor: stage.color, borderWidth: 1.5 },
                isPending && { borderColor: colors.amber, borderWidth: 1.5 },
                isLocked && styles.stageLocked,
              ]}
            >
              {/* Stage Header */}
              <View style={styles.stageHeader}>
                <View style={[styles.stageIcon, { backgroundColor: stage.bg }]}>
                  <Ionicons name={stage.icon} size={24} color={isLocked ? colors.ink3 : stage.color} />
                </View>
                <View style={styles.stageInfo}>
                  <View style={styles.stageNameRow}>
                    <Text style={styles.stageNumber}>STAGE {stage.number}</Text>
                    {isCompleted && (
                      <View style={[styles.statusBadge, { backgroundColor: stage.color }]}>
                        <Text style={styles.statusBadgeText}>VERIFIED</Text>
                      </View>
                    )}
                    {isPending && (
                      <View style={[styles.statusBadge, { backgroundColor: colors.amber }]}>
                        <Text style={styles.statusBadgeText}>UNDER REVIEW</Text>
                      </View>
                    )}
                    {isLocked && (
                      <Ionicons name="lock-closed-outline" size={14} color={colors.ink3} />
                    )}
                  </View>
                  <Text style={[styles.stageTitle, isLocked && { color: colors.ink3 }]}>
                    {stage.title}
                  </Text>
                  <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.stageDesc}>{stage.description}</Text>

              {/* What it unlocks */}
              <View style={styles.unlocksSection}>
                <Text style={styles.unlocksTitle}>UNLOCKS</Text>
                {stage.unlocks.map((item, i) => (
                  <View key={i} style={styles.unlockRow}>
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={isCompleted ? stage.color : colors.ink3}
                    />
                    <Text style={[styles.unlockText, isCompleted && { color: colors.ink }]}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {isAvailable && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: stage.color }]}
                  onPress={() => handleStageAction(stage)}
                  activeOpacity={0.85}
                  disabled={processingStage === stage.id}
                >
                  {processingStage === stage.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name={stage.icon} size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>{stage.actionLabel}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {isPending && (
                <View style={styles.pendingNote}>
                  <Ionicons name="time-outline" size={16} color={colors.amber} />
                  <Text style={styles.pendingText}>
                    {stage.id === 'biometric'
                      ? 'Your video selfie is being reviewed. This usually takes a few minutes.'
                      : 'Your document is under review. Typically completed within 24 hours.'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Trust info */}
        <View style={styles.trustCard}>
          <Ionicons name="shield-checkmark" size={18} color={colors.amber} />
          <Text style={styles.trustText}>
            Wanderkind uses a progressive trust model. Each verification stage builds confidence
            between walkers and hosts, keeping the community safe for everyone.
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

  // Progress card
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink3,
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.border,
  },
  progressSubtext: {
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Stage cards
  stageCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 12,
  },
  stageLocked: {
    opacity: 0.5,
  },
  stageHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageInfo: { flex: 1 },
  stageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  stageNumber: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 1,
  },
  stageSubtitle: {
    fontSize: 11,
    color: colors.ink3,
    fontWeight: '500',
  },
  stageDesc: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 19,
    marginBottom: 14,
  },

  // Unlocks section
  unlocksSection: {
    marginBottom: 14,
  },
  unlocksTitle: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '600',
    marginBottom: 8,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  unlockText: {
    fontSize: 12,
    color: colors.ink3,
    flex: 1,
  },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Pending note
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  pendingText: {
    fontSize: 12,
    color: colors.ink2,
    flex: 1,
    lineHeight: 17,
  },

  // Trust card
  trustCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.amber}10`,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 6,
  },
  trustText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 18,
  },
});
