import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../src/stores/auth';
import { DesktopGate } from '../src/components/web/DesktopGate';
import { ToastProvider } from '../src/components/ToastProvider';
import '../global.css';
import { initSentry, reportError } from '../src/lib/sentry';

// Initialize Sentry error monitoring as early as possible
initSentry();

// Root-level error boundary — last line of defence before a white screen.
// Uses the Wanderkind design system for a calm, Apple-style recovery UI.
import { Ionicons } from '@expo/vector-icons';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; retryCount: number }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.warn('[AppErrorBoundary]', error.message, info.componentStack);
    }
    reportError(error, { componentStack: info.componentStack, source: 'AppErrorBoundary' });
  }
  handleRetry = () => {
    this.setState(s => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
  };
  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      this.setState({ hasError: false, error: null, retryCount: 0 });
    }
  };
  render() {
    if (this.state.hasError) {
      const repeated = this.state.retryCount >= 2;
      return (
        <View style={appErrStyles.bg}>
          <View style={appErrStyles.card}>
            <View style={appErrStyles.iconCircle}>
              <Ionicons name="leaf-outline" size={32} color="#C8762A" />
            </View>
            <Text style={appErrStyles.title}>Wanderkind needs a moment</Text>
            <Text style={appErrStyles.body}>
              {repeated
                ? "The app is having trouble starting. Try a full reload."
                : "Something unexpected happened. Your data is safe."}
            </Text>
            <View style={appErrStyles.row}>
              {repeated ? (
                <TouchableOpacity onPress={this.handleReload} style={appErrStyles.primaryBtn} activeOpacity={0.85}>
                  <Text style={appErrStyles.primaryBtnText}>Reload App</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={this.handleRetry} style={appErrStyles.primaryBtn} activeOpacity={0.85}>
                  <Text style={appErrStyles.primaryBtnText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const appErrStyles = {
  bg: { flex: 1, backgroundColor: '#FAFAF5', justifyContent: 'center' as const, alignItems: 'center' as const, padding: 32 },
  card: { width: '100%' as const, maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center' as const, borderWidth: 1, borderColor: '#EDE8DC', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(200,118,42,0.1)', justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600' as const, color: '#1A1A18', textAlign: 'center' as const, marginBottom: 8, letterSpacing: -0.3 },
  body: { fontSize: 14, color: '#888', textAlign: 'center' as const, lineHeight: 21, marginBottom: 24 },
  row: { flexDirection: 'row' as const, gap: 10 },
  primaryBtn: { backgroundColor: '#C8762A', paddingVertical: 13, paddingHorizontal: 28, borderRadius: 24 },
  primaryBtnText: { color: '#FFF', fontWeight: '700' as const, fontSize: 14, letterSpacing: 0.2 },
};



function RootLayoutInner() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    // Signal first — guarantees the shell dismisses even if initialize() hangs
    // on a slow Supabase round-trip. The MutationObserver in public/index.html
    // is the primary path; this is a redundant secondary signal.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).__wkMounted?.();
    }
    initialize();
  }, []);

  // Global web error guard — catches unhandled errors & promise rejections
  // that fall outside React's error boundary (module load failures, async throws)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onError = (e: ErrorEvent) => {
      reportError(new Error(e.message || 'Global error'), { source: 'window.onerror', filename: e.filename, lineno: e.lineno });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
      reportError(err, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
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
    <AppErrorBoundary>
      <ToastProvider>
        <DesktopGate>
          <RootLayoutInner />
        </DesktopGate>
      </ToastProvider>
    </AppErrorBoundary>
  );
}
