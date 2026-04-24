import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../../lib/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gold' | 'parchment';
};

export function WKCard({ children, style, variant = 'default' }: Props) {
  return (
    <View style={[styles.base, variant === 'gold' && styles.gold, variant === 'parchment' && styles.parchment, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    padding: 16,
  },
  gold: {
    borderColor: colors.goldBorder,
    backgroundColor: '#FFFDF7',
  },
  parchment: {
    backgroundColor: colors.parchment,
    borderColor: colors.border,
  },
});
