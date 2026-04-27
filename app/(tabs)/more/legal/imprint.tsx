import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function ImprintScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Legal Imprint" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.h2, styles.title]}>Impressum (Legal Imprint)</Text>

        {/* Organization */}
        <WKCard variant="gold" style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>ORG.</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.value}>Joschua Bergmann</Text>
          </View>
        </WKCard>

        {/* Address */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Address</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.value}>
              Am Sonnberg 21{'\n'}Berg (Dienten) am Hochkönig{'\n'}5652 Österreich
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>hallo@wanderkind.love</Text>
          </View>
        </WKCard>

        {/* Dev. Partner */}
        <WKCard style={styles.card}>
          <Text style={[typography.h3, styles.heading]}>Dev. Partner</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.value}>KGD EMBASSY</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Represented by:</Text>
            <Text style={styles.value}>Joschua Bergmann</Text>
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
