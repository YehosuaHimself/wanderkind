import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';

export default function StampCeremony() {
  const router = useRouter();
  const { hostName } = useLocalSearchParams();
  const [stampScale] = useState(new Animated.Value(0));
  const [stampOpacity] = useState(new Animated.Value(0));
  const [particleOpacity] = useState(new Animated.Value(0));
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // Sequence: fade in, scale stamp, animate particles
    Animated.sequence([
      Animated.timing(stampOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(stampScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setShowContinue(true), 800);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stamp Ceremony</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.ceremonialText}>Your stamp from</Text>
        <Text style={styles.hostName}>{(hostName as string) || 'Your Host'}</Text>

        {/* Animated Stamp */}
        <View style={styles.stampContainer}>
          <Animated.View
            style={[
              styles.stamp,
              {
                transform: [{ scale: stampScale }],
                opacity: stampOpacity,
              },
            ]}
          >
            <View style={styles.stampCircle}>
              <Ionicons name="stamp" size={64} color={colors.surface} />
            </View>
          </Animated.View>

          {/* Animated Particles */}
          <Animated.View
            style={[
              styles.particles,
              { opacity: particleOpacity },
            ]}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    transform: [
                      { rotate: `${(360 / 8) * i}deg` },
                      { translateY: -80 },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={20} color={colors.gold} />
              </View>
            ))}
          </Animated.View>
        </View>

        <Text style={styles.celebrationText}>
          You've earned a{'\n'}stamp of accomplishment
        </Text>

        {/* Blessing Text */}
        <View style={styles.blessingBox}>
          <Text style={styles.blessingText}>
            "May your journey be blessed{'\n'}with hospitality and wonder."
          </Text>
        </View>
      </View>

      {showContinue && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.continueBtnText}>View Your Stamps</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  ceremonialText: { ...typography.bodySm, color: colors.ink3, marginBottom: 4 },
  hostName: { ...typography.h1, color: colors.amber, marginBottom: spacing.xl, textAlign: 'center' },
  stampContainer: { position: 'relative', width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl },
  stamp: { width: 160, height: 160 },
  stampCircle: {
    flex: 1,
    borderRadius: 80,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particles: { position: 'absolute', width: 200, height: 200 },
  particle: {
    position: 'absolute',
    left: 100,
    top: 100,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationText: { ...typography.h2, color: colors.ink, textAlign: 'center', marginTop: spacing.xl, lineHeight: 35 },
  blessingBox: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.parchment,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
  },
  blessingText: { ...typography.bodySm, color: colors.ink, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  continueBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
