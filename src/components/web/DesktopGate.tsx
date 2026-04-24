import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Animated, Easing } from 'react-native';

const useIsDesktop = () => {
  if (Platform.OS !== 'web') return false;
  const { width } = Dimensions.get('window');
  return width > 768;
};

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!isDesktop) return;
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, [isDesktop]);

  // Listen for resize on web
  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isDesktop) return <>{children}</>;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.w, { transform: [{ rotate: spin }] }]}>
        W
      </Animated.Text>
      <Text style={styles.title}>WANDERKIND</Text>
      <Text style={styles.subtitle}>is a mobile experience</Text>
      <View style={styles.divider} />
      <Text style={styles.body}>
        Open wanderkind.love on your phone{'\n'}to begin your journey.
      </Text>
      <View style={styles.qrHint}>
        <Text style={styles.hintText}>
          Scan the QR code or visit wanderkind.love on mobile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  w: {
    fontSize: 120,
    fontWeight: '200',
    color: '#C8762A',
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A120A',
    letterSpacing: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B5D4F',
    fontWeight: '300',
    marginBottom: 32,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#C8762A',
    opacity: 0.4,
    marginBottom: 32,
  },
  body: {
    fontSize: 16,
    color: '#6B5D4F',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  qrHint: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(200,118,42,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200,118,42,0.15)',
  },
  hintText: {
    fontSize: 14,
    color: '#9B8E7E',
    textAlign: 'center',
  },
});
