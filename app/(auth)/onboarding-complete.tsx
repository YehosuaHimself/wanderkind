import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

const { width, height } = Dimensions.get('window');

// Confetti particle component
const Confetti = ({ delay }: { delay: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const leftOffset = Math.random() * width;
  const rotation = Math.random() * 360;

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: leftOffset,
          transform: [
            { translateY },
            { rotate: `${rotation}deg` },
          ],
          opacity,
        },
      ]}
    >
      <Ionicons name="star" size={12} color={colors.amber} />
    </Animated.View>
  );
};

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { setOnboarded } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo scale and content fade
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    setOnboarded();
    router.replace('/(tabs)');
  };

  // Create confetti particles
  const confettiPieces = Array.from({ length: 20 }).map((_, i) => (
    <Confetti key={i} delay={i * 50} />
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti background */}
      <View style={styles.confettiContainer}>
        {confettiPieces}
      </View>

      <View style={styles.content}>
        {/* Animated logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
        </Animated.View>

        {/* Welcome text */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>You Are Now a Wanderkind</Text>
          <Text style={styles.subtitle}>
            Welcome to a community of wanderkinder and hosts who believe in the power of connection and generosity.
          </Text>

          <View style={styles.highlightSection}>
            <View style={styles.highlight}>
              <Ionicons name="walk" size={24} color={colors.amber} />
              <View>
                <Text style={styles.highlightTitle}>Walk Your Way</Text>
                <Text style={styles.highlightText}>
                  Explore beautiful European routes at your own pace.
                </Text>
              </View>
            </View>

            <View style={styles.highlight}>
              <Ionicons name="home" size={24} color={colors.amber} />
              <View>
                <Text style={styles.highlightTitle}>Open Your Door</Text>
                <Text style={styles.highlightText}>
                  Welcome wanderkinder into your home and stories.
                </Text>
              </View>
            </View>

            <View style={styles.highlight}>
              <Ionicons name="heart" size={24} color={colors.amber} />
              <View>
                <Text style={styles.highlightTitle}>Build Community</Text>
                <Text style={styles.highlightText}>
                  Connect with fellow Wanderkinder across Europe.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <WKButton
          title="Enter the App"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Text style={styles.footer}>
          Every step of your way is a blessing to someone.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    top: -20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing['2xl'],
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  highlightSection: {
    gap: spacing.lg,
  },
  highlight: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  highlightTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  highlightText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 19,
    maxWidth: 200,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    ...typography.caption,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
