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
import { detectLanguage, getTranslations, LANG_LABELS, LangCode } from '../../src/lib/i18n-landing';
import { IndependentBadge } from '../../src/components/web/IndependentBadge';
import { InAppBrowserPrompt } from '../../src/components/web/InAppBrowserPrompt';
import { isInAppBrowser } from '../../src/lib/in-app-browser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Render a string with **bold** segments as nested <Text> runs.
 * Used by the install guide so we can bold key phrases like "Scroll down"
 * inside translatable strings without splitting them into multiple keys.
 */
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

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
  // Detect once on mount — UA doesn't change mid-session.
  const [inAppBrowser] = useState(() =>
    Platform.OS === 'web' ? isInAppBrowser() : false
  );
  const {
    canNativeInstall,
    isIOS,
    isInstalled,
    install,
    canInstall,
  } = useInstallPrompt();

  // Short-circuit when running inside Instagram/Facebook/etc. embedded webview.
  // The install flow + OAuth do not work inside those sandboxes, so we show
  // a focused 'Open in Safari' prompt instead.
  // (The hooks above must still run on every render to satisfy the rules of hooks.)
  // The actual short-circuit return happens further down via the inAppBrowser flag.

  const [stats, setStats] = useState({ hosts: 505, routes: 26, countries: 10 });
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [lang, setLang] = useState<LangCode>('en');
  const t = getTranslations(lang);

  // Detect iPad (share button is top-right, not bottom)
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Restore persisted language or auto-detect
    try {
      const saved = localStorage.getItem('wk_lang') as LangCode | null;
      if (saved && ['en', 'de', 'es', 'fr', 'pt', 'it', 'nl'].includes(saved)) {
        setLang(saved);
      } else {
        setLang(detectLanguage());
      }
    } catch {
      setLang(detectLanguage());
    }
    const ua = navigator.userAgent || '';
    const iPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIPad(iPad);
  }, []);

  const switchLang = (code: LangCode) => {
    setLang(code);
    try { localStorage.setItem('wk_lang', code); } catch {}
  };

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
          supabase.from('hosts').select('id', { count: 'exact', head: true }).is('source_id', null),
          supabase.from('routes').select('id', { count: 'exact', head: true }),
        ]);
        const hostCount = hostsRes.count ?? 505;
        const routeCount = routesRes.count ?? 26;
        const { data: countryData } = await supabase
          .from('hosts')
          .select('country')
          .is('source_id', null)
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
          {/* Language Toggle — also available in installed state */}
          {Platform.OS === 'web' && (
            <View style={[styles.langRow, { marginBottom: 24 }]}>
              {(['en', 'de', 'es', 'fr', 'pt', 'it', 'nl'] as LangCode[]).map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langPill, lang === code && styles.langPillActive]}
                  onPress={() => switchLang(code)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch language to ${code.toUpperCase()}`}
                  accessibilityState={{ selected: lang === code }}
                >
                  <Text style={[styles.langPillText, lang === code && styles.langPillTextActive]}>
                    {LANG_LABELS[code]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Logo */}
          <View style={styles.logoContainer} accessible accessibilityLabel="Wanderkind logo" accessibilityRole="image">
            <Text style={styles.logoW}>W</Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">WANDERKIND</Text>
          <Text style={styles.subtitleInstalled}>
            {t.welcomeHome}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow} accessibilityLabel={`${stats.hosts} hosts, ${stats.routes} routes, ${stats.countries} countries`}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.hosts}+</Text>
              <Text style={styles.statLabel}>{t.openDoors}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.routes}</Text>
              <Text style={styles.statLabel}>{t.ways}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.countries}</Text>
              <Text style={styles.statLabel}>{t.countries}</Text>
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
            <Text style={styles.primaryBtnText}>{t.beginBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { haptic.light(); router.push('/(auth)/signin'); }}
            activeOpacity={0.7}
            style={styles.signinLink}
            accessibilityRole="button"
            accessibilityLabel={t.signinLink}
          >
            <Text style={styles.signinText}>{t.signinLink}</Text>
          </TouchableOpacity>

          <View style={styles.hostBanner}>
            <View style={styles.hostBannerLine} />
            <Text style={styles.hostBannerText}>{t.hostBanner}</Text>
            <View style={styles.hostBannerLine} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── NOT INSTALLED: The Install Gate ───
  if (inAppBrowser) {
    return <InAppBrowserPrompt />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.gateScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.gateContent, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Language Toggle */}
          {Platform.OS === 'web' && (
            <View style={styles.langRow}>
              {(['en', 'de', 'es', 'fr', 'pt', 'it', 'nl'] as LangCode[]).map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langPill, lang === code && styles.langPillActive]}
                  onPress={() => switchLang(code)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch language to ${code.toUpperCase()}`}
                  accessibilityState={{ selected: lang === code }}
                >
                  <Text style={[styles.langPillText, lang === code && styles.langPillTextActive]}>
                    {LANG_LABELS[code]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Eyebrow */}
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrowText}>{t.eyebrow}</Text>
            <View style={styles.eyebrowLine} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer} accessible accessibilityLabel="Wanderkind logo" accessibilityRole="image">
            <Text style={styles.logoW}>W</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} accessibilityRole="header">WANDERKIND</Text>
          <Text style={styles.subtitle}>
            {t.subtitle}
          </Text>

          {/* Value prop — what it is */}
          <View style={styles.valueSection}>
            <Text style={styles.valueTitle}>{t.valueTitle}</Text>
            <Text style={styles.valueBody}>
              {t.valueBody(stats.hosts, stats.countries, stats.routes)}
            </Text>
          </View>

          {/* Trust assurance */}
          <View style={styles.trustRow}>
            {[
              { icon: 'shield-checkmark-outline' as const, text: t.trustSafe },
              { icon: 'cloud-offline-outline' as const, text: t.trustNoStore },
              { icon: 'lock-closed-outline' as const, text: t.trustPrivacy },
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
              {t.independenceText}
            </Text>
          </View>

          {/* Independent badge — like App Store / Play Store badges */}
          {Platform.OS === 'web' && (
            <View style={styles.badgeContainer}>
              <IndependentBadge line1={t.badgeLine1} line2={t.badgeLine2} />
            </View>
          )}
        </Animated.View>

        {/* Install CTA */}
        <Animated.View style={[styles.gateActions, { transform: [{ scale: ctaPulse }] }]}>
          <TouchableOpacity
            style={[styles.installBtn, installing && styles.installBtnDisabled]}
            onPress={handleInstall}
            activeOpacity={0.85}
            disabled={installing}
            accessibilityRole="button"
            accessibilityLabel={isIOS ? t.installBtnIOS : t.installBtnAndroid}
          >
            <Ionicons
              name={isIOS ? 'share-outline' : 'download-outline'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.installBtnText}>
              {installing ? t.installing : isIOS ? t.installBtnIOS : t.installBtnAndroid}
            </Text>
          </TouchableOpacity>

          <Text style={styles.installNote}>
            {isIOS ? t.installNoteIOS : t.installNoteAndroid}
          </Text>

          {/* Tiny technical note */}
          <View style={styles.techNote}>
            <Ionicons name="information-circle-outline" size={12} color={colors.ink3} />
            <Text style={styles.techNoteText}>
              {t.techNote}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <IOSGuideOverlay onClose={() => setShowIOSGuide(false)} lang={lang} isIPad={isIPad} />
      )}
    </SafeAreaView>
  );
}

/**
 * Inline iOS guide — simpler version that lives in this file
 * to avoid circular dependency issues with InstallBanner.
 *
 * User-paced: tap "Next" to advance (no auto-timer).
 * iPad-aware: adjusts share button location text.
 */
function IOSGuideOverlay({ onClose, lang, isIPad }: { onClose: () => void; lang: LangCode; isIPad: boolean }) {
  const t = getTranslations(lang);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const steps = [
    { icon: 'share-outline' as const, title: t.guideStep1Title, desc: isIPad ? t.guideStep1DescIPad : t.guideStep1Desc },
    { icon: 'add-circle-outline' as const, title: t.guideStep2Title, desc: t.guideStep2Desc },
    { icon: 'checkmark-circle' as const, title: t.guideStep3Title, desc: t.guideStep3Desc },
  ];

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <Animated.View style={[styles.guideOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.guideBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.guideCard, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.guideHeader}>
          <View style={styles.guideLogo}>
            <Text style={styles.guideLogoText}>W</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>{t.guideTitle}</Text>
            <Text style={styles.guideSubtitle}>{t.guideSubtitle}</Text>
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
                  {isActive && <Text style={styles.stepDesc}>{renderRich(step.desc)}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User-paced: Next button instead of auto-advance */}
        <TouchableOpacity
          style={styles.guideNextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.guideNextBtnText}>{t.guideNext}</Text>
          <Ionicons name={activeStep < 2 ? 'arrow-forward' : 'checkmark'} size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {activeStep === 0 && !isIPad && (
          <View style={styles.pointerContainer}>
            <Ionicons name="arrow-down" size={28} color={colors.amber} />
            <Text style={styles.pointerText}>{t.guidePointer}</Text>
          </View>
        )}
        {activeStep === 0 && isIPad && (
          <View style={styles.pointerContainer}>
            <Ionicons name="arrow-up" size={28} color={colors.amber} />
            <Text style={styles.pointerText}>{t.guidePointer}</Text>
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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 12,
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

  // ─── Language Toggle ───
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink3,
    letterSpacing: 0.5,
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },

  // ─── Badge ───
  badgeContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // ─── Guide Next Button ───
  guideNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  guideNextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
