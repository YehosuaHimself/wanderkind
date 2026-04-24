import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';

export default function ImprintScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Legal Imprint" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.h2, styles.title]}>Impressum (Legal Imprint)</Text>

        {/* Company Information */}
        <WKCard variant="gold" style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Company Information</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>Wanderkind GmbH</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>
              Hauptstraße 42{'\n'}69115 Heidelberg{'\n'}Germany
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>hello@wanderkind.com</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>+49 (0) 6221 123456</Text>
          </View>
        </WKCard>

        {/* Management */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Management</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Managing Director:</Text>
            <Text style={styles.value}>European Pilgrimage Foundation</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Represented by:</Text>
            <Text style={styles.value}>Board of Directors</Text>
          </View>
        </WKCard>

        {/* Registration */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Registration</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Trade Register:</Text>
            <Text style={styles.value}>Handelsregister Heidelberg</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Register Number:</Text>
            <Text style={styles.value}>HRB 123456</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>VAT ID:</Text>
            <Text style={styles.value}>DE 123 456 789</Text>
          </View>
        </WKCard>

        {/* Responsibility */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Responsibility for Content</Text>
          <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
            As service providers, we are liable for our own content on these pages in accordance with general laws. However, you as the user are responsible for the content you upload, including photos, stamps, and messages. We are not obligated to monitor transmitted or stored information or to investigate circumstances that suggest illegal activity.
          </Text>
        </WKCard>

        {/* Dispute Resolution */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Dispute Resolution</Text>
          <Text style={[typography.body, { color: colors.ink2, lineHeight: 24 }]}>
            The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr/. We are not obligated to participate in alternative dispute resolution proceedings.
          </Text>
        </WKCard>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.ink, marginBottom: spacing.xl },
  card: { marginBottom: spacing.lg },
  heading: { color: colors.ink, marginBottom: spacing.md },
  infoBlock: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.amber, marginBottom: spacing.sm },
  value: { ...typography.body, color: colors.ink2 },
});
