import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';

const useIsDesktop = () => {
  if (Platform.OS !== 'web') return false;
  const { width } = Dimensions.get('window');
  // Only gate true desktop browsers (not tablets/iPads which may be > 768px)
  // Check for mouse-based interaction (no touch) to identify real desktops
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return false;
  return width > 1024;
};

// Inject CSS keyframes for 3D Y-axis rotation (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'wk-desktop-gate-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes wk-rotate-y {
        0% { transform: perspective(800px) rotateY(0deg); }
        100% { transform: perspective(800px) rotateY(360deg); }
      }
      .wk-rotating-w {
        animation: wk-rotate-y 8s linear infinite;
        display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }
}

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();

  // Listen for resize on web
  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isDesktop) return <>{children}</>;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <div className="wk-rotating-w" style={{
          fontSize: 120,
          fontWeight: 200,
          color: '#C8762A', // amber — inline for web div
          marginBottom: 24,
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
        }}>
          W
        </div>
      ) : (
        <Text style={styles.w}>W</Text>
      )}
      <Text style={styles.title}>WANDERKIND</Text>
      <Text style={styles.subtitle}>is a mobile experience</Text>
      <View style={styles.divider} />
      <Text style={styles.body}>
        Open wanderkind.love on your phone{'\n'}to begin your journey.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  w: {
    fontSize: 120,
    fontWeight: '200',
    color: colors.amber,
    marginBottom: spacing.lg,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 6,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.ink2,
    fontWeight: '300',
    marginBottom: spacing.xl,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: colors.amber,
    opacity: 0.4,
    marginBottom: spacing.xl,
  },
  body: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: 40,
  },
});
