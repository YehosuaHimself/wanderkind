import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { useAuthStore } from '../src/stores/auth';
import { DesktopGate } from '../src/components/web/DesktopGate';
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
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FAFAF5' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {this.state.error?.message}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 10, textAlign: 'center' }}>
            {this.state.error?.stack?.slice(0, 500)}
          </Text>
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
      <DesktopGate>
        <RootLayoutInner />
      </DesktopGate>
    </ErrorBoundary>
  );
}
