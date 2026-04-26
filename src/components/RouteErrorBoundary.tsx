import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../lib/theme';

type Props = { children: React.ReactNode; routeName?: string; };
type State = { hasError: boolean; error: Error | null; };

export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="refresh-outline" size={28} color={colors.amber} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              {this.props.routeName ? `${this.props.routeName} encountered an issue` : 'This section encountered an issue'}
            </Text>
            <TouchableOpacity onPress={this.handleRetry} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  content: { alignItems: 'center', maxWidth: 280 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.amberBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h3, color: colors.ink, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.bodySm, color: colors.ink3, textAlign: 'center', marginBottom: spacing.xl },
  retryButton: { backgroundColor: colors.amber, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
});
