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
 * ROOT CAUSE: Expo's default HTML template includes a <style id="expo-reset">
 * that sets `body { overflow: hidden }`. In iOS WKWebView standalone mode,
 * this prevents the virtual keyboard from appearing when tapping inputs.
 *
 * WHY PREVIOUS FIX DIDN'T WORK:
 * - document.body.style.overflow = '' only clears INLINE styles
 * - The overflow:hidden comes from a STYLESHEET rule (<style> tag)
 * - Clearing the inline style just reveals the stylesheet's overflow:hidden
 * - Also, position:fixed on body can itself block keyboard in WKWebView
 * - RNW's ResponderSystem does NOT call preventDefault() — it was never
 *   the problem, so all the event interception code was unnecessary
 *
 * CORRECT FIX:
 * 1. Modify the <style> element's textContent to remove overflow:hidden
 * 2. Use CSS !important to override RNW's inline user-select:none
 */
function usePWAStandaloneFix() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // === Fix 1: Remove overflow:hidden from Expo's reset stylesheet ===
    // We edit the <style> element's textContent directly because
    // document.body.style.overflow = '' does NOT override stylesheet rules.
    if (isStandalone) {
      const expoReset = document.getElementById('expo-reset');
      if (expoReset && expoReset.textContent) {
        expoReset.textContent = expoReset.textContent.replace(
          /overflow:\s*hidden\s*;?/g,
          ''
        );
      }
      // Also set an explicit inline override as belt-and-suspenders
      document.body.style.setProperty('overflow', 'auto', 'important');
      // Prevent unwanted body bounce/scroll without blocking keyboard
      document.body.style.setProperty('overscroll-behavior', 'none');
    }

    // === Fix 2: Inject CSS to ensure inputs are always interactive ===
    // RNW applies user-select:none as INLINE styles on every View wrapper.
    // Per CSS spec, !important in a stylesheet overrides inline styles.
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

    // === Fix 3: Register service worker for PWA ===
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
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
