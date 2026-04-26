import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function PrivacyPolicyScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Privacy Policy" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.h2, styles.title]}>Privacy Policy</Text>
        <Text style={styles.date}>Last updated: April 2024</Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>1. Information We Collect</Text>
          <Text style={styles.body}>
            Wanderkind collects information you provide directly, such as when you create an account or contact us. This includes:
          </Text>
          <Text style={styles.bullet}>• Name and email address</Text>
          <Text style={styles.bullet}>• Location data (with your permission)</Text>
          <Text style={styles.bullet}>• Profile information and photos</Text>
          <Text style={styles.bullet}>• Messages and communications</Text>
          <Text style={styles.bullet}>• Walk history and stamps</Text>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>2. How We Use Your Information</Text>
          <Text style={styles.body}>
            We use the information we collect to provide, maintain, and improve our services, including:
          </Text>
          <Text style={styles.bullet}>• Operating and maintaining the Wanderkind app</Text>
          <Text style={styles.bullet}>• Communicating with you about your account</Text>
          <Text style={styles.bullet}>• Showing your profile to other users (with privacy controls)</Text>
          <Text style={styles.bullet}>• Creating and displaying your walking stamps</Text>
          <Text style={styles.bullet}>• Sending notifications (with your consent)</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>3. Data Protection</Text>
          <Text style={styles.body}>
            Wanderkind takes data security seriously. We implement industry-standard encryption and security measures to protect your information. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>4. Location Data</Text>
          <Text style={styles.body}>
            Wanderkind uses location data to show your approximate location on maps and to help you find nearby hosts and walkers. You can disable location sharing in app settings at any time.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>5. Sharing Your Information</Text>
          <Text style={styles.body}>
            We do not sell your personal information. We may share information with service providers who help operate our platform. We may also share information when required by law.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>6. Your Rights</Text>
          <Text style={styles.body}>
            You have the right to access, modify, or delete your personal information. You can manage your privacy settings within the app or contact us directly.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>7. Contact Us</Text>
          <Text style={styles.body}>
            If you have questions about this privacy policy, please contact us at hallo@wanderkind.love.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.ink, marginBottom: spacing.sm },
  date: { ...typography.bodySm, color: colors.ink3, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  heading: { color: colors.ink, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.ink2, lineHeight: 24 },
  bullet: { ...typography.body, color: colors.ink2, lineHeight: 20, marginLeft: spacing.lg },
});
