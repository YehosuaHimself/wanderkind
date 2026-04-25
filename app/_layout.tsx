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

function RootLayoutInner() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
