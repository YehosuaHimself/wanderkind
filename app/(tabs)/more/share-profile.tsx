import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function ShareProfileScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const profileLink = 'https://wanderkind.com/profile/john-trail-walker';

  const handleCopyLink = async () => {
    await Clipboard.setString(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Wanderkind profile: ${profileLink}`,
        title: 'Share Profile',
        url: profileLink,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const shareOptions = [
    {
      icon: 'logo-whatsapp' as const,
      label: 'WhatsApp',
      color: '#25D366',
      onPress: () => {
        const text = `Check out my Wanderkind profile: ${profileLink}`;
        // Deep link to WhatsApp
      },
    },
    {
      icon: 'logo-instagram' as const,
      label: 'Instagram',
      color: '#E4405F',
      onPress: () => {
        // Copy link for Instagram share
        handleCopyLink();
      },
    },
    {
      icon: 'mail-outline' as const,
      label: 'Email',
      color: colors.amber,
      onPress: () => {
        // Share via email
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Share Your Profile" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <WKCard>
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={64} color={colors.amber} />
              </View>
              <Text style={[typography.bodySm, { color: colors.ink3, textAlign: 'center', marginTop: spacing.md }]}>
                Scan to view your profile
              </Text>
            </View>
          </WKCard>
        </View>

        {/* Deep Link Section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Your Profile Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {profileLink}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={colors.amber}
              />
            </TouchableOpacity>
          </View>
          {copied && (
            <Text style={[typography.caption, { color: colors.green, marginTop: spacing.sm }]}>
              Copied to clipboard!
            </Text>
          )}
        </View>

        {/* Share Button */}
        <WKButton
          title="Share Profile"
          onPress={handleShare}
          variant="primary"
          fullWidth
          icon={<Ionicons name="share-social-outline" size={16} color="#fff" />}
        />

        {/* Social Sharing */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Share On</Text>
          <View style={styles.socialGrid}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.socialButton, { borderColor: option.color }]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={option.icon} size={28} color={option.color} />
                <Text style={[styles.socialLabel, { color: option.color }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Info */}
        <WKCard variant="parchment">
          <View style={styles.privacyHeader}>
            <Ionicons name="information-circle-outline" size={18} color={colors.amber} />
            <Text style={[typography.h3, { color: colors.ink, marginLeft: spacing.md }]}>
              Privacy
            </Text>
          </View>
          <Text style={[typography.bodySm, { color: colors.ink2, marginTop: spacing.md, lineHeight: 20 }]}>
            Your profile link is public and shareable. Update your privacy settings to control what information is visible.
          </Text>
        </WKCard>

        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Visibility</Text>
          <WKCard>
            {[
              { label: 'Show Name', sublabel: 'Your trail name is always visible' },
              { label: 'Show Photo', sublabel: 'Your profile picture is always visible' },
              { label: 'Show Stamps', sublabel: 'Your walking achievements' },
            ].map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.visibilityRow,
                  idx < 2 && styles.visibilityRowBorder,
                ]}
              >
                <View style={styles.visibilityText}>
                  <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>
                    {item.label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.ink3, marginTop: 2 }]}>
                    {item.sublabel}
                  </Text>
                </View>
                <View style={styles.toggleSmall}>
                  <View style={styles.toggleSmallOn} />
                </View>
              </View>
            ))}
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  qrSection: { marginBottom: spacing.xl },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.amberBg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, color: colors.amber },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  linkText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.amber,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-around',
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
  },
  socialLabel: { ...typography.caption, fontWeight: '600', marginTop: spacing.sm },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  visibilityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  visibilityText: { flex: 1 },
  toggleSmall: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 3,
  },
  toggleSmallOn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
});
