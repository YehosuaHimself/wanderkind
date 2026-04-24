import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, shadows, radii } from '../../src/lib/theme';

const { width } = Dimensions.get('window');

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'walker' | 'host' | 'both' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: '/(auth)/signup',
        params: { role: selectedRole },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Who Are You?" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Every Wanderkind is both walker and host. Choose your path.</Text>

        {/* Walker Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === 'walker' && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole('walker')}
          activeOpacity={0.7}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="walk" size={48} color={colors.amber} />
          </View>
          <Text style={styles.cardTitle}>I Walk</Text>
          <Text style={styles.cardDescription}>
            Discover routes across Europe. Find free shelter along the way.
          </Text>
          {selectedRole === 'walker' && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={colors.amber} />
            </View>
          )}
        </TouchableOpacity>

        {/* Host Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === 'host' && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole('host')}
          activeOpacity={0.7}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="home" size={48} color={colors.amber} />
          </View>
          <Text style={styles.cardTitle}>I Host</Text>
          <Text style={styles.cardDescription}>
            Open your door to pilgrims. Share your home and stories.
          </Text>
          {selectedRole === 'host' && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={colors.amber} />
            </View>
          )}
        </TouchableOpacity>

        {/* Both Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === 'both' && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole('both')}
          activeOpacity={0.7}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="heart" size={48} color={colors.amber} />
          </View>
          <Text style={styles.cardTitle}>Both</Text>
          <Text style={styles.cardDescription}>
            Walk the ways and welcome others. The full Wanderkind experience.
          </Text>
          {selectedRole === 'both' && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={colors.amber} />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedRole}
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
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 220,
    justifyContent: 'center',
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.amber,
    borderWidth: 2,
    backgroundColor: colors.amberBg,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  cardDescription: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 19,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
