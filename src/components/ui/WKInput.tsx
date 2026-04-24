import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, typography, spacing, radii } from '../../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
};

export function WKInput({ label, error, helper, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.ink3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={helper}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {helper && !error && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,    // 8-point grid
    paddingVertical: 12,     // acceptable: ensures 44px min-height with fontSize 16
    fontSize: 16,     // body minimum per guidelines V3 §03
    color: colors.ink,
  },
  inputFocused: {
    borderColor: colors.amber,
  },
  inputError: {
    borderColor: colors.red,
  },
  error: {
    fontSize: 11,
    color: colors.red,
    marginTop: 4,
  },
  helper: {
    fontSize: 11,
    color: colors.ink3,
    marginTop: 4,
  },
});
