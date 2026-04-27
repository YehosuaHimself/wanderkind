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
 * In iOS PWA standalone mode, React Native Web's ResponderSystem
 * registers document-level touch event listeners that intercept
 * touchstart/touchend/pointermove and call preventDefault()/
 * stopPropagation(). Combined with body { overflow: hidden } and
 * touchAction: none on ScrollView, this prevents the virtual
 * keyboard from appearing when tapping native HTML <input> elements.
 *
 * This hook runs once on mount and:
 * 1. Removes overflow:hidden from body (uses position:fixed instead)
 * 2. Adds a document-level capture listener that stops RNW from
 *    intercepting touch events on input/textarea/select elements
 * 3. Adds a MutationObserver to strip userSelect:none and
 *    touchAction:none from ancestors of inputs as React renders
 * 4. Registers the service worker for PWA install support
 */
function usePWAStandaloneFix() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // === Fix 1: Replace overflow:hidden with position:fixed ===
    // overflow:hidden on <body> prevents keyboard from pushing viewport
    // in WKWebView standalone mode. position:fixed achieves the same
    // no-scroll effect without blocking the keyboard.
    if (isStandalone) {
      document.body.style.overflow = '';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }

    // === Fix 2: Capture-phase listener to protect inputs from RNW ===
    // RNW's ResponderSystem uses capture-phase listeners on document.
    // We add our own capture listener that fires BEFORE RNW's and
    // calls stopImmediatePropagation() for input-targeted events,
    // preventing RNW from ever seeing them.
    const inputTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

    const protectInputs = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target?.tagName) return;

      // If the event target is an input, stop RNW from intercepting
      if (inputTags.has(target.tagName)) {
        e.stopPropagation();
      }

      // Also check if target is inside a contenteditable
      if (target.getAttribute?.('contenteditable') === 'true') {
        e.stopPropagation();
      }
    };

    // These events are what RNW's ResponderSystem listens to
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

    const observer = new MutationObserver(() => {
      fixAncestorStyles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });

    // Run once immediately
    fixAncestorStyles();

    // === Fix 4: focusin interceptor ===
    // When an input receives focus, clean its ancestor chain one more time
    // right before the keyboard should appear
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

    // === Fix 5: Register service worker for PWA ===
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Cleanup
    return () => {
      events.forEach(evt => {
        document.removeEventListener(evt, protectInputs, { capture: true } as any);
      });
      document.removeEventListener('focusin', onFocusIn, true);
      observer.disconnect();
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
