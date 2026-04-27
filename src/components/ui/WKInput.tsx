import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors, typography, spacing, radii } from '../../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
};

/**
 * WKInput — Cross-platform text input
 *
 * On web: renders a native HTML <input> to bypass React Native Web's
 * user-select: none bug that blocks text input on iOS Safari.
 *
 * On native: uses standard RNW TextInput.
 */
export function WKInput({ label, error, helper, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <WebInput
        label={label}
        error={error}
        helper={helper}
        focused={focused}
        setFocused={setFocused}
        style={style}
        {...rest}
      />
    );
  }

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

/**
 * WebInput — native HTML input for web platform
 * Completely bypasses RNW's TextInput and its user-select: none issue
 */
function WebInput({
  label,
  error,
  helper,
  focused,
  setFocused,
  style,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
  editable,
  multiline,
  numberOfLines,
  ...rest
}: Props & { focused: boolean; setFocused: (f: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChangeText?.(e.target.value);
    },
    [onChangeText],
  );

  // Map RNW keyboardType to HTML input type
  let inputType = 'text';
  if (secureTextEntry) inputType = 'password';
  else if (keyboardType === 'email-address') inputType = 'email';
  else if (keyboardType === 'number-pad' || keyboardType === 'numeric') inputType = 'text';
  else if (keyboardType === 'phone-pad') inputType = 'tel';
  else if (keyboardType === 'url') inputType = 'url';

  // Map autoCapitalize
  let autoCapitalizeAttr: string | undefined;
  if (autoCapitalize === 'none') autoCapitalizeAttr = 'off';
  else if (autoCapitalize === 'characters') autoCapitalizeAttr = 'characters';
  else if (autoCapitalize === 'words') autoCapitalizeAttr = 'words';

  const borderColor = error
    ? colors.red
    : focused
    ? colors.amber
    : colors.border;

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.surface,
    border: `1px solid ${borderColor}`,
    borderRadius: radii.md,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    lineHeight: 1.5,
    color: colors.ink,
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    WebkitAppearance: 'none' as any,
    appearance: 'none' as any,
    // Explicitly enable text interaction — the whole point of this component
    WebkitUserSelect: 'text',
    userSelect: 'text',
    touchAction: 'manipulation',
    pointerEvents: 'auto' as const,
  };

  const containerStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.ink2,
    marginBottom: 8,
    letterSpacing: 0.3,
    display: 'block',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 13,
    color: colors.red,
    marginTop: 6,
    lineHeight: 1.4,
  };

  const helperStyle: React.CSSProperties = {
    fontSize: 13,
    color: colors.ink3,
    marginTop: 6,
    lineHeight: 1.4,
  };

  // Ref callback — no event interception needed since RNW's ResponderSystem
  // does NOT call preventDefault() on touch events. The real fix is in
  // _layout.tsx (removes body overflow:hidden from Expo's stylesheet).
  const inputCallbackRef = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
  }, []);

  const sharedProps = {
    ref: inputCallbackRef as any,
    value: value ?? '',
    onChange: handleChange,
    placeholder,
    maxLength,
    disabled: editable === false,
    autoCapitalize: autoCapitalizeAttr as any,
    style: inputStyle,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    'aria-label': label,
    'aria-describedby': helper ? `${label}-helper` : undefined,
    // Prevent iOS zoom
    'data-testid': `wk-input-${label}`,
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      {multiline ? (
        <textarea
          {...sharedProps}
          rows={numberOfLines || 3}
        />
      ) : (
        <input
          {...sharedProps}
          type={inputType}
          inputMode={
            keyboardType === 'number-pad' || keyboardType === 'numeric'
              ? 'numeric'
              : keyboardType === 'email-address'
              ? 'email'
              : keyboardType === 'phone-pad'
              ? 'tel'
              : undefined
          }
        />
      )}
      {error && <div style={errorStyle}>{error}</div>}
      {helper && !error && (
        <div style={helperStyle} id={`${label}-helper`}>
          {helper}
        </div>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
  },
  inputFocused: {
    borderColor: colors.amber,
  },
  inputError: {
    borderColor: colors.red,
  },
  error: {
    fontSize: 13,
    color: colors.red,
    marginTop: 6,
    lineHeight: 18,
  },
  helper: {
    fontSize: 13,
    color: colors.ink3,
    marginTop: 6,
    lineHeight: 18,
  },
});
