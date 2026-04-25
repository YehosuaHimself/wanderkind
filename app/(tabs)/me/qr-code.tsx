import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function QRCodeScreen() {
  useAuthGuard();

  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      const trailName = profile?.trail_name || 'Wanderkind';
      const message = `Join me on the Wanderkind journey! My trail name is ${trailName}. Scan my QR code or find me in the app.`;

      await Share.share({
        message,
        title: `${trailName}'s Wanderkind Profile`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const trailName = profile?.trail_name || 'Your Trail Name';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="My QR Code" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Share your profile QR code with other wanderers
        </Text>

        <WKCard variant="parchment" style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={80} color={colors.amber} />
          </View>
          <Text style={styles.qrLabel}>Scan to connect</Text>
        </WKCard>

        <View style={styles.infoSection}>
          <Text style={styles.trailName}>{trailName}</Text>
          <Text style={styles.badge}>
            {(profile?.tier || 'wanderkind').toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.nights_walked ?? 0}</Text>
            <Text style={styles.statLabel}>NIGHTS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.stamps_collected ?? 0}</Text>
            <Text style={styles.statLabel}>STAMPS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.nights_hosted ?? 0}</Text>
            <Text style={styles.statLabel}>HOSTED</Text>
          </View>
        </View>

        <View style={styles.descCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.descText}>
            Your QR code links to your public profile. Share it with other wanderers on the road, on social media, or in messages.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Share"
          onPress={handleShare}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={<Ionicons name="share-social" size={16} color="#fff" />}
        />
      </View>
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
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLabel: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: spacing.md,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  trailName: {
    ...typography.h2,
    color: colors.ink,
  },
  badge: {
    ...typography.monoXs,
    color: colors.amber,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.amberBg,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.amber,
  },
  statLabel: {
    ...typography.monoXs,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderLt,
  },
  descCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  descText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
