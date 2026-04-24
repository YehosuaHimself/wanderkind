import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';

const PASSES = [
  {
    id: 'wanderkind',
    title: 'Wanderkind Pass',
    description: 'Your official credential',
    icon: 'medal',
    color: colors.gold,
    route: '/(tabs)/me/pass/wanderkind',
  },
  {
    id: 'food',
    title: 'Food Pass',
    description: 'Meals shared tracker',
    icon: 'restaurant',
    color: colors.passFood,
    route: '/(tabs)/me/pass/food',
  },
  {
    id: 'hospitality',
    title: 'Hospitality Pass',
    description: 'Nights hosted credential',
    icon: 'bed',
    color: colors.passHosp,
    route: '/(tabs)/me/pass/hospitality',
  },
  {
    id: 'water',
    title: 'Water Pass',
    description: 'Water sources shared',
    icon: 'water',
    color: colors.passWater,
    route: '/(tabs)/me/pass/water',
  },
];

export default function PassesScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Your Passes" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Your credentials and achievements
        </Text>

        {PASSES.map(pass => (
          <TouchableOpacity
            key={pass.id}
            style={styles.passCard}
            onPress={() => router.push(pass.route as any)}
            activeOpacity={0.7}
          >
            <WKCard style={styles.inner}>
              <View style={styles.passHeader}>
                <View
                  style={[
                    styles.passIcon,
                    { backgroundColor: `${pass.color}15` },
                  ]}
                >
                  <Ionicons name={pass.icon as any} size={24} color={pass.color} />
                </View>

                <View style={styles.passInfo}>
                  <Text style={styles.passTitle}>{pass.title}</Text>
                  <Text style={styles.passDesc}>{pass.description}</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
              </View>
            </WKCard>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            Each pass is a record of your contributions to the Wanderkind community.
          </Text>
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  passCard: {
    marginBottom: spacing.md,
  },
  inner: {
    margin: 0,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  passIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passInfo: {
    flex: 1,
  },
  passTitle: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  passDesc: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
    marginTop: spacing.xl,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
});
