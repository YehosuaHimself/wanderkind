import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInstallPrompt } from '../../src/hooks/useInstallPrompt';
import { colors, typography, spacing } from '../../src/lib/theme';
import { haptic } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * WelcomeScreen — The Gate
 *
 * Wanderkind is install-first. This screen has ONE purpose:
 * communicate the value proposition and get the user to install.
 *
 * Once installed (detected via display-mode: standalone),
 * the user proceeds to signup/signin.
 *
 * On native platforms (not web), skip straight to onboarding.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const {
    canNativeInstall,
    isIOS,
    isInstalled,
    install,
    canInstall,
  } = useInstallPrompt();

  const [stats, setStats] = useState({ hosts: 505, routes: 26, countries: 10 });
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const ctaScale = useRef(new Animated.Value(0.95)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 12, tension: 40, useNativeDriver: true }),
      Animated.spring(ctaScale, { toValue: 1, friction: 10, tension: 60, useNativeDriver: true }),
    ]).start();

    // Gentle pulse on CTA to draw attention
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(ctaPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    const timer = setTimeout(() => pulse.start(), 2000);
    return () => { clearTimeout(timer); pulse.stop(); };
  }, []);

  // If already installed → show the real entry points
  const installed = isInstalled;

  // On native platforms, go straight to role-select
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(auth)/role-select');
    }
  }, []);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [hostsRes, routesRes] = await Promise.all([
          supabase.from('hosts').select('id', { count: 'exact', head: true }),
          supabase.from('routes').select('id', { count: 'exact', head: true }),
        ]);
        const hostCount = hostsRes.count ?? 505;
        const routeCount = routesRes.count ?? 26;
        const { data: countryData } = await supabase
          .from('hosts')
          .select('country')
          .not('country', 'is', null);
        const uniqueCountries = new Set((countryData ?? []).map((h: any) => h.country));
        setStats({
          hosts: hostCount,
          routes: routeCount,
          countries: uniqueCountries.size || 10,
        });
      } catch {
        // Keep defaults
      }
    };
    fetchStats();
  }, []);

  const handleInstall = async () => {
    if (installing) return;
    haptic.medium();
    if (canNativeInstall) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // ─── INSTALLED STATE: Show the real entry ───
  if (installed) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          {/* Logo */}
          <View style={styles.logoContainer} accessible accessibilityLabel="Wanderkind logo" accessibilityRole="image">
            <Text style={styles.logoW}>W</Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">WANDERKIND</Text>
          <Text style={styles.subtitleInstalled}>
            Welcome home, wanderer.
          </Text>

          {/* Stats */}
          <View style={styles.statsRow} accessibilityLabel={`${stats.hosts} hosts, ${stats.routes} routes, ${stats.countries} countries`}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.hosts}+</Text>
              <Text style={styles.statLabel}>OPEN DOORS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.routes}</Text>
              <Text style={styles.statLabel}>WAYS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.countries}</Text>
              <Text style={styles.statLabel}>COUNTRIES</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.installedActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { haptic.medium(); router.push('/(auth)/role-select'); }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Begin your way"
          >
            <Text style={styles.primaryBtnText}>BEGIN YOUR WAY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { haptic.light(); router.push('/(auth)/signin'); }}
            activeOpacity={0.7}
            style={styles.signinLink}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={styles.signinText}>I already have a pass</Text>
          </TouchableOpacity>

          <View style={styles.hostBanner}>
            <View style={styles.hostBannerLine} />
            <Text style={styles.hostBannerText}>EVERY WANDERKIND IS ALSO A HOST</Text>
            <View style={styles.hostBannerLine} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── NOT INSTALLED: The Install Gate ───
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.gateScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.gateContent, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Eyebrow */}
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrowText}>EST. MMXXVI</Text>
            <View style={styles.eyebrowLine} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer} accessible accessibilityLabel="Wanderkind logo" accessibilityRole="image">
            <Text style={styles.logoW}>W</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} accessibilityRole="header">WANDERKIND</Text>
          <Text style={styles.subtitle}>
            Walk the ancient ways.{'\n'}Stay with those who walk them too.
          </Text>

          {/* Value prop — what it is */}
          <View style={styles.valueSection}>
            <Text style={styles.valueTitle}>A network of open doors</Text>
            <Text style={styles.valueBody}>
              {stats.hosts}+ hosts across {stats.countries} countries welcome wanderers
              along {stats.routes} historic walking routes. Free stays, shared meals,
              and real human connection — no booking fees, no middlemen.
            </Text>
          </View>

          {/* Trust assurance */}
          <View style={styles.trustRow}>
            {[
              { icon: 'shield-checkmark-outline' as const, text: 'Perfectly safe' },
              { icon: 'cloud-offline-outline' as const, text: 'No app store' },
              { icon: 'lock-closed-outline' as const, text: 'Your data stays yours' },
            ].map((item, i) => (
              <View key={i} style={styles.trustItem}>
                <Ionicons name={item.icon} size={16} color={colors.amber} />
                <Text style={styles.trustText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* The independence message */}
          <View style={styles.independenceCard}>
            <Text style={styles.independenceText}>
              Wanderkind is independent — not an app store product,
              not a corporation. For the perfect experience, install
              it directly to your phone. Lightweight, instant, free.
            </Text>
          </View>
        </Animated.View>

        {/* Install CTA */}
        <Animated.View style={[styles.gateActions, { transform: [{ scale: ctaPulse }] }]}>
          <TouchableOpacity
            style={[styles.installBtn, installing && styles.installBtnDisabled]}
            onPress={handleInstall}
            activeOpacity={0.85}
            disabled={installing}
            accessibilityRole="button"
            accessibilityLabel={isIOS ? 'Add Wanderkind to home screen' : 'Install Wanderkind'}
          >
            <Ionicons
              name={isIOS ? 'share-outline' : 'download-outline'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.installBtnText}>
              {installing ? 'INSTALLING...' : isIOS ? 'ADD TO HOME SCREEN' : 'INSTALL WANDERKIND'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.installNote}>
            {isIOS
              ? 'Tap to see how — takes 10 seconds'
              : 'One tap — no app store needed'}
          </Text>

          {/* Tiny technical note */}
          <View style={styles.techNote}>
            <Ionicons name="information-circle-outline" size={12} color={colors.ink3} />
            <Text style={styles.techNoteText}>
              Installs as a lightweight web app ({`<`}2 MB). No tracking, no ads, no bloat.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <IOSGuideOverlay onClose={() => setShowIOSGuide(false)} />
      )}
    </SafeAreaView>
  );
}

/**
 * Inline iOS guide — simpler version that lives in this file
 * to avoid circular dependency issues with InstallBanner
 */
function IOSGuideOverlay({ onClose }: { onClose: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { icon: 'share-outline' as const, title: 'Tap the Share button', desc: 'The square with an upward arrow — at the bottom of Safari' },
    { icon: 'add-circle-outline' as const, title: '"Add to Home Screen"', desc: 'Scroll down in the share menu and tap it' },
    { icon: 'checkmark-circle' as const, title: 'Tap "Add"', desc: 'Wanderkind appears on your home screen — open it like any app' },
  ];

  return (
    <Animated.View style={[styles.guideOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.guideBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.guideCard, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.guideHeader}>
          <View style={styles.guideLogo}>
            <Text style={styles.guideLogoText}>W</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>Install Wanderkind</Text>
            <Text style={styles.guideSubtitle}>3 quick steps — takes 10 seconds</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={colors.ink3} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.step, isActive && styles.stepActive]}
                onPress={() => setActiveStep(i)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.stepNumber,
                  isActive && styles.stepNumberActive,
                  isDone && styles.stepNumberDone,
                ]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumberText, (isActive || isDone) && { color: '#FFFFFF' }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stepTitleRow}>
                    <Ionicons name={step.icon} size={18} color={isActive ? colors.amber : colors.ink3} />
                    <Text style={[styles.stepTitle, isActive && { color: colors.amber }]}>{step.title}</Text>
                  </View>
                  {isActive && <Text style={styles.stepDesc}>{step.desc}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeStep === 0 && (
          <View style={styles.pointerContainer}>
            <Ionicons name="arrow-down" size={28} color={colors.amber} />
            <Text style={styles.pointerText}>Share button is down here in Safari</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ─── INSTALLED STATE ───
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  subtitleInstalled: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: 32,
  },
  installedActions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.amber,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  signinLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signinText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.amber,
  },

  // ─── GATE STATE (not installed) ───
  gateScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  gateContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  eyebrowLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.amber,
  },
  eyebrowText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    letterSpacing: 4,
    color: colors.ink3,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoW: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },

  // Value proposition
  valueSection: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  valueTitle: {
    ...typography.h3,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  valueBody: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Trust badges
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
  },

  // Independence card
  independenceCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.amberLine,
    marginBottom: 8,
    width: '100%',
  },
  independenceText: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Install CTA
  gateActions: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    alignItems: 'center',
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.amber,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  installBtnDisabled: {
    opacity: 0.7,
  },
  installBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  installNote: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: 10,
    fontWeight: '500',
  },
  techNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  techNoteText: {
    ...typography.caption,
    color: colors.ink3,
  },

  // Stats row (shared between both states)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.amber,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.ink3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },

  // Host banner (installed state)
  hostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  hostBannerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.amber,
    opacity: 0.4,
  },
  hostBannerText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.amber,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ─── iOS Guide ───
  guideOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  guideBackdrop: {
    flex: 1,
  },
  guideCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  guideLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideLogoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  guideTitle: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.ink,
  },
  guideSubtitle: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: 2,
  },
  stepsContainer: {
    gap: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  stepActive: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberLine,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberActive: {
    backgroundColor: colors.amber,
  },
  stepNumberDone: {
    backgroundColor: colors.green,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.amber,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
    marginTop: 6,
    marginLeft: 26,
  },
  pointerContainer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  pointerText: {
    fontSize: 12,
    color: colors.ink3,
    fontWeight: '500',
  },
});
