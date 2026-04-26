import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function TermsScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Terms of Service" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.h2, styles.title]}>Terms of Service</Text>
        <Text style={styles.date}>Last updated: April 2024</Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>1. Acceptance of Terms</Text>
          <Text style={styles.body}>
            By accessing and using the Wanderkind application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>2. Use License</Text>
          <Text style={styles.body}>
            Permission is granted to temporarily download one copy of the materials (information or software) on Wanderkind for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <Text style={styles.bullet}>• Modify or copy the materials</Text>
          <Text style={styles.bullet}>• Use the materials for any commercial purpose</Text>
          <Text style={styles.bullet}>• Attempt to decompile or reverse engineer any software contained on Wanderkind</Text>
          <Text style={styles.bullet}>• Remove any copyright or other proprietary notations from the materials</Text>
          <Text style={styles.bullet}>• Transfer the materials to another person or "mirror" the materials on any other server</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>3. Disclaimer</Text>
          <Text style={styles.body}>
            The materials on Wanderkind are provided on an "as is" basis. Wanderkind makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>4. Limitations</Text>
          <Text style={styles.body}>
            In no event shall Wanderkind or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Wanderkind.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>5. User Content</Text>
          <Text style={styles.body}>
            By posting, displaying, or transmitting any content on Wanderkind, you grant Wanderkind a royalty-free, perpetual, irrevocable, and non-exclusive license to use such content in any manner it deems fit, including copying, modifying, and distributing such content.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>6. Changes to Terms</Text>
          <Text style={styles.body}>
            Wanderkind may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.heading]}>7. Governing Law</Text>
          <Text style={styles.body}>
            These terms and conditions are governed by and construed in accordance with the laws of the European Union, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
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
