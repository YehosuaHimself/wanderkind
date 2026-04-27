import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal,
  Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * IOSInstallGuide — animated 3-step overlay showing how to Add to Home Screen on Safari.
 */
function IOSInstallGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setActiveStep(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    // Auto-advance steps every 2.5s
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(timer);
  }, [visible]);

  const steps = [
    {
      icon: 'share-outline' as const,
      title: 'Tap the Share button',
      desc: 'Find the share icon at the bottom of your browser',
      highlight: 'Look for the square with an upward arrow',
    },
    {
      icon: 'add-circle-outline' as const,
      title: 'Scroll and tap "Add to Home Screen"',
      desc: 'Scroll down in the share menu',
      highlight: 'It has a + icon next to it',
    },
    {
      icon: 'checkmark-circle' as const,
      title: 'Tap "Add" to confirm',
      desc: 'Wanderkind will appear on your home screen',
      highlight: 'Open it anytime — no browser needed',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.guideOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.guideBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.guideCard, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
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

          {/* Steps */}
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
                      <Ionicons name="checkmark" size={14} color={colors.surface} />
                    ) : (
                      <Text style={[styles.stepNumberText, (isActive || isDone) && { color: colors.surface }]}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepTitleRow}>
                      <Ionicons
                        name={step.icon}
                        size={18}
                        color={isActive ? colors.amber : colors.ink3}
                      />
                      <Text style={[styles.stepTitle, isActive && { color: colors.amber }]}>
                        {step.title}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.stepDetail}>
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                        <Text style={styles.stepHighlight}>{step.highlight}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Share icon pointer */}
          {activeStep === 0 && (
            <View style={styles.pointerContainer}>
              <Ionicons name="arrow-down" size={28} color={colors.amber} />
              <Text style={styles.pointerText}>Share button is down here</Text>
              <View style={styles.pointerShareIcon}>
                <Ionicons name="share-outline" size={22} color={colors.amber} />
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * InstallBanner — the main install prompt component.
 *
 * Usage: <InstallBanner mode="banner" /> on welcome screen
 *        <InstallBanner mode="fullscreen" /> for post-signup
 *        <InstallBanner mode="footer" /> for persistent subtle link
 */
export function InstallBanner({ mode = 'banner' }: { mode?: 'banner' | 'fullscreen' | 'footer' }) {
  const {
    canNativeInstall,
    isIOS,
    isInstalled,
    showBanner,
    footerOnly,
    install,
    dismiss,
    canInstall,
  } = useInstallPrompt();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if ((mode === 'banner' && showBanner) || mode === 'fullscreen' || mode === 'footer') {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 10, tension: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [showBanner, mode]);

  // Don't render on native platforms
  if (Platform.OS !== 'web') return null;

  // Don't render if already installed
  if (isInstalled) return null;

  // Don't render if can't install via any method
  if (!canInstall) return null;

  const handleInstall = async () => {
    if (installing) return; // Prevent double-tap
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

  const handleDismiss = () => {
    haptic.light();
    dismiss();
  };

  // ─── FOOTER MODE ───
  if (mode === 'footer' || (mode === 'banner' && footerOnly)) {
    return (
      <TouchableOpacity style={styles.footerLink} onPress={handleInstall} activeOpacity={0.7}>
        <Ionicons name="download-outline" size={14} color={colors.amber} />
        <Text style={styles.footerLinkText}>Install App</Text>
        <IOSInstallGuide visible={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </TouchableOpacity>
    );
  }

  // ─── BANNER MODE ───
  if (mode === 'banner') {
    if (!showBanner) return null;

    return (
      <Animated.View style={[styles.banner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]} accessible accessibilityRole="alert" accessibilityLabel="Install Wanderkind app for the best experience">
        {/* Dismiss X */}
        <TouchableOpacity
          style={styles.bannerDismiss}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss install banner"
        >
          <Ionicons name="close" size={16} color={colors.ink3} />
        </TouchableOpacity>

        <View style={styles.bannerIcon}>
          <Ionicons name="download-outline" size={20} color={colors.surface} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Install Wanderkind</Text>
          <Text style={styles.bannerDesc}>
            {isIOS
              ? 'Add to Home Screen for the full experience'
              : 'Get the full app — no app store needed'}
          </Text>
        </View>
        <TouchableOpacity style={styles.bannerButton} onPress={handleInstall} activeOpacity={0.8} disabled={installing} accessibilityRole="button" accessibilityLabel="Install Wanderkind">
          <Text style={styles.bannerButtonText}>INSTALL</Text>
        </TouchableOpacity>

        <IOSInstallGuide visible={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </Animated.View>
    );
  }

  // ─── FULLSCREEN MODE (post-signup) ───
  if (mode === 'fullscreen') {
    return (
      <Animated.View style={[styles.fullscreen, { opacity: fadeAnim }]}>
        <View style={styles.fullscreenContent}>
          <View style={styles.fullscreenLogo}>
            <Text style={styles.fullscreenLogoText}>W</Text>
          </View>

          <Text style={styles.fullscreenTitle}>Make It Official</Text>
          <Text style={styles.fullscreenSubtitle}>
            Install Wanderkind on your home screen{'\n'}for the complete experience
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {[
              { icon: 'expand-outline' as const, text: 'Full-screen — no browser bars' },
              { icon: 'flash-outline' as const, text: 'Instant access from home screen' },
              { icon: 'cloud-offline-outline' as const, text: 'Works even with weak signal' },
              { icon: 'bag-remove-outline' as const, text: 'No app store — lightweight & free' },
            ].map((item, i) => (
              <View key={i} style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.amber} />
                </View>
                <Text style={styles.benefitText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.fullscreenButton} onPress={handleInstall} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color={colors.surface} />
            <Text style={styles.fullscreenButtonText}>
              {isIOS ? 'Show Me How' : 'Install Wanderkind'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fullscreenSkip} onPress={handleDismiss} activeOpacity={0.7}>
            <Text style={styles.fullscreenSkipText}>Maybe later</Text>
          </TouchableOpacity>
        </View>

        <IOSInstallGuide visible={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // ─── BANNER ───
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.amberLine,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  bannerDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
    paddingRight: 16,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  bannerDesc: {
    fontSize: 12,
    color: colors.ink2,
    marginTop: 2,
    lineHeight: 16,
  },
  bannerButton: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bannerButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // ─── FOOTER LINK ───
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
    letterSpacing: 0.5,
  },

  // ─── FULLSCREEN ───
  fullscreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullscreenContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  fullscreenLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fullscreenLogoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  fullscreenTitle: {
    ...typography.h1,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  fullscreenSubtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  benefits: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  fullscreenButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fullscreenSkip: {
    marginTop: 16,
    paddingVertical: 8,
  },
  fullscreenSkipText: {
    fontSize: 14,
    color: colors.ink3,
    fontWeight: '500',
  },

  // ─── IOS GUIDE ───
  guideOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  guideSubtitle: {
    fontSize: 13,
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
  stepContent: {
    flex: 1,
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
  stepDetail: {
    marginTop: 6,
    marginLeft: 26,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
  },
  stepHighlight: {
    fontSize: 12,
    color: colors.amber,
    fontWeight: '600',
    marginTop: 4,
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
  pointerShareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
});
