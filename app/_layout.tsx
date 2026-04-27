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
 * Multiple layers of defense to ensure text inputs work in PWA standalone:
 *
 * 1. Remove overflow:hidden from Expo's <style> element (not just inline)
 * 2. Capture-phase event listeners to isolate inputs from RNW's event system
 * 3. MutationObserver to strip userSelect:none from input ancestors
 * 4. focusin interceptor for last-chance style cleanup
 * 5. Injected CSS with !important to override RNW inline styles
 * 6. Service worker registration
 */
function usePWAStandaloneFix() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // === Fix 1: Remove overflow:hidden from Expo's reset stylesheet ===
    // CRITICAL: document.body.style.overflow = '' only clears INLINE styles.
    // The overflow:hidden comes from a STYLESHEET rule in <style id="expo-reset">,
    // so we must modify the stylesheet text directly.
    if (isStandalone) {
      const expoReset = document.getElementById('expo-reset');
      if (expoReset && expoReset.textContent) {
        expoReset.textContent = expoReset.textContent.replace(
          /overflow:\s*hidden\s*;?/g,
          ''
        );
      }
      // Belt-and-suspenders: explicit inline override
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.body.style.setProperty('overscroll-behavior', 'none');
    }

    // === Fix 2: Capture-phase listener to protect inputs ===
    const inputTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

    const protectInputs = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target?.tagName) return;
      if (inputTags.has(target.tagName) || target.getAttribute?.('contenteditable') === 'true') {
        e.stopPropagation();
      }
    };

    const events = [
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'mousedown', 'mousemove', 'mouseup',
    ];

    events.forEach(evt => {
      document.addEventListener(evt, protectInputs, { capture: true, passive: true });
    });

    // === Fix 3: MutationObserver to strip problematic inline styles ===
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

    // === Fix 4: focusin interceptor ===
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

    // === Fix 5: Inject CSS to override RNW inline styles ===
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

    // === Fix 6: Register service worker for PWA ===
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      events.forEach(evt => {
        document.removeEventListener(evt, protectInputs, { capture: true } as any);
      });
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
