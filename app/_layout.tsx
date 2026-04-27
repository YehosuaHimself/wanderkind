import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../src/stores/auth';
import { DesktopGate } from '../src/components/web/DesktopGate';
import { ToastProvider } from '../src/components/ToastProvider';
import '../global.css';

// Web error boundary to show errors instead of white screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };
  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (Platform.OS === 'web') {
      window.location.href = '/';
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FAFAF5' }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>
            {Platform.OS === 'web' ? '⚠' : '!'}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#1A1A18', textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={this.handleGoHome}
              style={{ backgroundColor: '#C8762A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Go Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.handleReload}
              style={{ backgroundColor: '#E8E4DA', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
            >
              <Text style={{ color: '#1A1A18', fontWeight: '600', fontSize: 14 }}>Reload</Text>
            </TouchableOpacity>
          </View>
          {__DEV__ && (
            <Text style={{ fontSize: 11, color: '#999', marginTop: 20, textAlign: 'center', maxWidth: 300 }}>
              {this.state.error?.stack?.slice(0, 300)}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * PWA Standalone Mode Fix for iOS WKWebView
 *
 * The keyboard fix requires TWO things working together:
 *
 * 1. Correct PWA meta tags in the HTML (handled by scripts/post-export.js)
 *    - apple-mobile-web-app-capable, manifest link, viewport-fit
 *    - overflow:hidden removed from Expo's stylesheet at the HTML level
 *
 * 2. CSS overrides to ensure inputs are interactive (handled here)
 *    - Strip userSelect:none that RNW sets on ancestor divs
 *    - Inject CSS with !important for input text selection
 *    - Remove overflow:hidden from Expo's runtime stylesheet
 *
 * CRITICAL: Do NOT use stopPropagation() on touch/pointer/mouse events.
 * iOS uses the complete touchstart → touchend event flow to decide whether
 * to show the keyboard. Intercepting these events with stopPropagation
 * causes iOS to focus the input (orange border) but never show the keyboard.
 * RNW's ResponderSystem does NOT call preventDefault(), so it's harmless.
 */
function usePWAStandaloneFix() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // === Fix 1: Remove overflow:hidden from Expo's reset stylesheet ===
    if (isStandalone) {
      const expoReset = document.getElementById('expo-reset');
      if (expoReset && expoReset.textContent) {
        expoReset.textContent = expoReset.textContent.replace(
          /overflow:\s*hidden\s*;?/g,
          ''
        );
      }
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.body.style.setProperty('overscroll-behavior', 'none');
    }

    // === Fix 2: MutationObserver to strip userSelect:none from input ancestors ===
    // RNW sets userSelect:none on wrapper divs which blocks text selection.
    // We strip it whenever new inputs appear or styles change.
    const inputTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

    const fixAncestorStyles = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        let el = input.parentElement;
        while (el && el !== document.body) {
          if (el.style.userSelect === 'none') {
            el.style.userSelect = '';
            (el.style as any).webkitUserSelect = '';
          }
          if (el.style.touchAction === 'none') {
            el.style.touchAction = 'manipulation';
          }
          el = el.parentElement;
        }
      });
    };

    const observer = new MutationObserver(() => fixAncestorStyles());
    observer.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style'],
    });
    fixAncestorStyles();

    // === Fix 3: focusin interceptor for last-chance style cleanup ===
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (!t?.tagName) return;
      if (inputTags.has(t.tagName) || t.getAttribute?.('contenteditable') === 'true') {
        let el = t.parentElement;
        while (el && el !== document.body) {
          if (el.style) {
            el.style.userSelect = '';
            (el.style as any).webkitUserSelect = '';
            if (el.style.touchAction === 'none') {
              el.style.touchAction = 'manipulation';
            }
          }
          el = el.parentElement;
        }
      }
    };
    document.addEventListener('focusin', onFocusIn, true);

    // === Fix 4: Inject CSS to override RNW inline styles ===
    const fix = document.createElement('style');
    fix.id = 'wk-pwa-input-fix';
    fix.textContent = [
      'html body input, html body textarea, html body select, html body [contenteditable="true"] {',
      '  -webkit-user-select: text !important;',
      '  user-select: text !important;',
      '  touch-action: manipulation !important;',
      '  -webkit-appearance: none !important;',
      '  appearance: none !important;',
      '  pointer-events: auto !important;',
      '  font-size: 16px !important;',
      '}',
    ].join('\n');
    document.head.appendChild(fix);

    // === Fix 5: Register service worker for PWA ===
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      observer.disconnect();
      const el = document.getElementById('wk-pwa-input-fix');
      if (el) el.remove();
    };
  }, []);
}

function RootLayoutInner() {
  const initialize = useAuthStore(s => s.initialize);

  // Apply PWA standalone mode fixes for iOS
  usePWAStandaloneFix();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250, gestureEnabled: true }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DesktopGate>
          <RootLayoutInner />
        </DesktopGate>
      </ToastProvider>
    </ErrorBoundary>
  );
}
