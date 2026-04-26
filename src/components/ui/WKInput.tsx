import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors, typography, spacing, radii } from '../../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
};

export function WKInput({ label, error, helper, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Web fix: ensure the underlying <input> element has correct styles
  // RNW applies user-select: none as inline styles which blocks focus on iOS Safari
  useEffect(() => {
    if (Platform.OS !== 'web' || !inputRef.current) return;
    const node = inputRef.current as any;
    // RNW exposes the DOM node via _node or through findDOMNode pattern
    const el = node._node || node;
    if (el && el.style) {
      el.style.userSelect = 'text';
      el.style.webkitUserSelect = 'text';
      el.style.pointerEvents = 'auto';
    }
    // Also try to find the actual <input> inside
    if (el && el.querySelector) {
      const input = el.querySelector('input, textarea');
      if (input) {
        input.style.userSelect = 'text';
        input.style.webkitUserSelect = 'text';
        input.style.pointerEvents = 'auto';
        input.style.fontSize = '16px'; // prevent iOS zoom
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={inputRef}
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
