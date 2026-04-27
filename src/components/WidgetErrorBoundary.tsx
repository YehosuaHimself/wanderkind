/**
 * WidgetErrorBoundary — Silent widget-level error container.
 *
 * When a small interactive widget crashes (a story ring, an avatar,
 * a single card), render nothing (or a minimal placeholder) rather
 * than propagating the error upward.
 *
 * This is the innermost layer — aggressive containment for leaf nodes.
 *
 * Usage:
 *   <WidgetErrorBoundary>
 *     <StoryRing ... />
 *   </WidgetErrorBoundary>
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

type Props = {
  children: React.ReactNode;
  /**
   * When true, shows a subtle placeholder instead of nothing.
   * Useful for list items where the gap would look broken.
   */
  showPlaceholder?: boolean;
  /** Width of placeholder. Defaults to 64 (story ring size). */
  placeholderWidth?: number;
  /** Height of placeholder. Defaults to 64. */
  placeholderHeight?: number;
};

type State = { hasError: boolean };

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.warn('[WidgetErrorBoundary]', error.message);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { showPlaceholder, placeholderWidth = 64, placeholderHeight = 64 } = this.props;

    if (!showPlaceholder) return null;

    return (
      <View
        style={[
          styles.placeholder,
          { width: placeholderWidth, height: placeholderHeight, borderRadius: placeholderWidth / 2 },
        ]}
      />
    );
  }
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.borderLt,
    opacity: 0.5,
  },
});
