/**
 * SectionErrorBoundary — Inline section-level error container.
 *
 * When a major section within a screen fails (a feed, a card list,
 * a map overlay), only that section shows the error. The rest of the
 * screen remains fully functional.
 *
 * Design: compact card, same width as its parent, subtle — it should
 * feel like a placeholder, not an alarm.
 *
 * Usage:
 *   <SectionErrorBoundary label="Host List">
 *     <HostCardCarousel />
 *   </SectionErrorBoundary>
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../lib/theme';

type Props = {
  children: React.ReactNode;
  /** Short label for the failing section — shown in the error state. */
  label?: string;
  /** Minimum height of the fallback container. Defaults to 80. */
  minHeight?: number;
};

type State = {
  hasError: boolean;
};

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.warn(`[SectionErrorBoundary:${this.props.label ?? 'Section'}]`, error.message);
    }
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label, minHeight = 80 } = this.props;

    return (
      <View style={[styles.container, { minHeight }]}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.ink3} />
        <Text style={styles.text}>
          {label ? `${label} couldn't load` : "This section couldn't load"}
        </Text>
        <TouchableOpacity onPress={this.handleRetry} style={styles.retryBtn} activeOpacity={0.7}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    margin: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.ink3,
  },
  retryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
  },
});
