import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * PWA Install Prompt Hook
 *
 * Handles the full cross-browser install flow:
 * - Chrome/Edge/Samsung: captures beforeinstallprompt for native one-tap install
 * - Safari iOS: detects iOS for manual share-sheet guide
 * - Standalone detection: hides prompt when already installed
 * - Dismiss tracking: 24h cooldown, max 3 shows, then footer-only
 */

// Storage keys
const DISMISS_COUNT_KEY = 'wk_install_dismiss_count';
const LAST_DISMISS_KEY = 'wk_install_last_dismiss';
const INSTALLED_KEY = 'wk_app_installed';

const MAX_BANNER_SHOWS = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Detect platform
    const ua = navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if already running as standalone (installed)
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    const isInStandalone = standaloneQuery?.matches || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    // Check if user previously installed
    const wasInstalled = getStorageItem(INSTALLED_KEY) === 'true';
    setIsInstalled(wasInstalled || isInStandalone);

    if (wasInstalled || isInStandalone) {
      setShowBanner(false);
      return;
    }

    // Check dismiss cooldown
    const dismissCount = parseInt(getStorageItem(DISMISS_COUNT_KEY) || '0', 10);
    const lastDismiss = parseInt(getStorageItem(LAST_DISMISS_KEY) || '0', 10);
    const cooldownElapsed = Date.now() - lastDismiss > COOLDOWN_MS;

    if (dismissCount >= MAX_BANNER_SHOWS) {
      setDismissed(true);
      setShowBanner(false);
    } else if (!cooldownElapsed && dismissCount > 0) {
      setDismissed(true);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    // Capture Chrome's beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      promptRef.current = prompt;
      setDeferredPrompt(prompt);
      // Show banner if not in cooldown
      if (dismissCount < MAX_BANNER_SHOWS && cooldownElapsed) {
        setShowBanner(true);
      }
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      promptRef.current = null;
      setStorageItem(INSTALLED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen for standalone changes (e.g., iOS returning to app)
    const handleStandaloneChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        setShowBanner(false);
      }
    };
    standaloneQuery?.addEventListener?.('change', handleStandaloneChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery?.removeEventListener?.('change', handleStandaloneChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const prompt = promptRef.current;
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
        setStorageItem(INSTALLED_KEY, 'true');
        promptRef.current = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch {}
    return false;
  }, []);

  const dismiss = useCallback(() => {
    const count = parseInt(getStorageItem(DISMISS_COUNT_KEY) || '0', 10) + 1;
    setStorageItem(DISMISS_COUNT_KEY, String(count));
    setStorageItem(LAST_DISMISS_KEY, String(Date.now()));
    setDismissed(true);
    setShowBanner(false);
  }, []);

  const canNativeInstall = !!deferredPrompt;

  return {
    /** Whether the native install prompt is available (Chrome/Edge/Samsung) */
    canNativeInstall,
    /** Whether this is iOS Safari (needs manual guide) */
    isIOS,
    /** Whether this is Android */
    isAndroid,
    /** Whether the app is already installed / running standalone */
    isInstalled: isInstalled || isStandalone,
    /** Whether the user has dismissed the banner (in cooldown or maxed out) */
    dismissed,
    /** Whether to show the full banner (respects cooldown + max shows) */
    showBanner,
    /** Whether the banner has been shown too many times (footer-only mode) */
    footerOnly: parseInt(getStorageItem(DISMISS_COUNT_KEY) || '0', 10) >= MAX_BANNER_SHOWS,
    /** Trigger the native Chrome install prompt */
    install,
    /** Dismiss the banner (starts 24h cooldown) */
    dismiss,
    /** Can install via any method (native or guided) */
    canInstall: (canNativeInstall || isIOS) && !isInstalled && !isStandalone,
  };
}
