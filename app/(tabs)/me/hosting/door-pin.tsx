import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function DoorPinScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [doorPin, setDoorPin] = useState('4729');
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const generateNewPin = () => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setDoorPin(newPin);
    setShowPin(true);
  };

  const copyToClipboard = () => {
    // In a real app, use react-native-clipboard
    setCopiedPin(doorPin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Door PIN: ${doorPin}\n\nPlease enter this code at the door to access the property.`,
        title: 'Door Access PIN',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Door Access PIN" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Information Card */}
          <WKCard variant="parchment">
            <View style={styles.infoHeader}>
              <Ionicons name="key" size={24} color={colors.ink2} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Door Access Code</Text>
                <Text style={styles.infoSubtitle}>
                  Share with confirmed guests only
                </Text>
              </View>
            </View>
          </WKCard>

          {/* PIN Display */}
          <WKCard style={styles.pinCard}>
            <Text style={styles.pinLabel}>Current PIN</Text>
            <View style={styles.pinDisplayWrapper}>
              <View style={styles.pinDisplay}>
                {showPin ? (
                  <Text style={styles.pinValue}>{doorPin}</Text>
                ) : (
                  <View style={styles.pinDots}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={styles.pinDot} />
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowPin(!showPin)}
              >
                <Ionicons
                  name={showPin ? 'eye-off' : 'eye'}
                  size={24}
                  color={colors.amber}
                />
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <WKButton
                title={copiedPin === doorPin ? 'Copied!' : 'Copy PIN'}
                onPress={copyToClipboard}
                variant="outline"
                size="sm"
                fullWidth
              />
            </View>
          </WKCard>

          {/* Share Card */}
          <WKCard>
            <View style={styles.shareSection}>
              <View style={styles.shareHeader}>
                <Ionicons name="share-social" size={20} color={colors.amber} />
                <Text style={styles.shareTitle}>Share with Guest</Text>
              </View>
              <Text style={styles.shareText}>
                Share the PIN directly with confirmed guests via messaging
              </Text>
              <WKButton
                title="Share PIN"
                onPress={handleShare}
                variant="primary"
                fullWidth
                style={styles.shareBtn}
              />
            </View>
          </WKCard>

          {/* Generate New PIN */}
          <WKCard variant="gold">
            <View style={styles.generateSection}>
              <View style={styles.generateHeader}>
                <Ionicons name="refresh" size={20} color={colors.amber} />
                <Text style={styles.generateTitle}>Generate New PIN</Text>
              </View>
              <Text style={styles.generateText}>
                Create a new PIN for additional security or after guests check out
              </Text>
              <WKButton
                title="Generate New PIN"
                onPress={generateNewPin}
                variant="outline"
                fullWidth
                style={styles.generateBtn}
              />
            </View>
          </WKCard>

          {/* Security Tips */}
          <WKCard>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.amber} />
              <Text style={styles.tipsTitle}>Security Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.tipText}>Only share PIN with confirmed guests</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.tipText}>Change PIN after each guest checkout</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.tipText}>Share via secure messaging only</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.tipText}>Don't include PIN in welcome instructions</Text>
              </View>
            </View>
          </WKCard>

          {/* History (Optional) */}
          <WKCard variant="parchment">
            <View style={styles.historyHeader}>
              <Ionicons name="time" size={20} color={colors.ink2} />
              <Text style={styles.historyTitle}>Last Generated</Text>
            </View>
            <Text style={styles.historyText}>
              May 12, 2024 at 2:30 PM
            </Text>
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  infoSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  pinCard: {
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  pinLabel: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
  },
  pinDisplayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pinDisplay: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinValue: {
    ...typography.display,
    color: colors.amber,
    letterSpacing: 8,
  },
  pinDots: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: radii.full,
    backgroundColor: colors.amber,
  },
  toggleButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    gap: spacing.md,
  },
  shareSection: {
    gap: spacing.md,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  shareText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 20,
  },
  shareBtn: {
    marginTop: spacing.md,
  },
  generateSection: {
    gap: spacing.md,
  },
  generateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  generateTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  generateText: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
  generateBtn: {
    marginTop: spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipText: {
    ...typography.bodySm,
    color: colors.ink,
    flex: 1,
    lineHeight: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  historyTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  historyText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
});
