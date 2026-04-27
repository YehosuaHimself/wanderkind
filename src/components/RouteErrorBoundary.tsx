/**
 * RouteErrorBoundary — Screen-level error container.
 *
 * Apple design principle: an error is an empty state, not a catastrophe.
 * When a screen fails, show a calm, contextual recovery UI. Never a
 * white screen, never a stack trace, never a red box.
 *
 * Use this to wrap the root of every tab screen and every stack screen.
 *
 * Usage:
 *   <RouteErrorBoundary routeName="Map">
 *     <MapScreen />
 *   </RouteErrorBoundary>
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../lib/theme';

type Props = {
  children: React.ReactNode;
  routeName?: string;
  /** Custom message — defaults to a generic one. */
  message?: string;
  /** Icon to show — defaults to 'leaf-outline' (path metaphor). */
  icon?: keyof typeof Ionicons.glyphMap;
};

type State = {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
};

export class RouteErrorBoundary extends React.Component<Props, State> {
  private fadeAnim = new Animated.Value(0);

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: send to error reporting (Sentry etc.)
    if (__DEV__) {
      console.warn(`[RouteErrorBoundary:${this.props.routeName ?? 'Unknown'}]`, error.message);
      console.warn(info.componentStack);
    }
  }

  componentDidUpdate(_: Props, prev: State) {
    if (this.state.hasError && !prev.hasError) {
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }

  handleRetry = () => {
    this.fadeAnim.setValue(0);
    this.setState(s => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const icon = this.props.icon ?? 'leaf-outline';
    const name = this.props.routeName;

    return (
      <Animated.View style={[styles.container, { opacity: this.fadeAnim }]}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={28} color={colors.amber} />
          </View>

          {/* Copy */}
          <Text style={styles.title}>
            {name ? `${name} is unavailable` : 'Something went wrong'}
          </Text>
          <Text style={styles.body}>
            {this.props.message ?? "An unexpected issue occurred. Your progress is safe — tap below to try again."}
          </Text>

          {/* Retry */}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={this.handleRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={14} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>

          {/* Retry count hint after multiple failures */}
          {this.state.retryCount >= 2 && (
            <Text style={styles.hint}>
              Still not working? Try reloading the app.
            </Text>
          )}
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.amber}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.amber,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: colors.ink3,
    textAlign: 'center',
  },
});
