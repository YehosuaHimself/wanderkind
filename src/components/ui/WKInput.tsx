import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors, typography, spacing, radii } from '../../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  /** Web-only: override the autoComplete hint passed to the underlying <input> */
  autoComplete?: any;
  /** Web-only: override the form field name (defaults to a slug of the label) */
  name?: string;
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
  style,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete: autoCompleteProp,
  name: nameProp,
  maxLength,
  editable,
  multiline,
  numberOfLines,
  ...rest
}: Props) {
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

  // Derive a sensible autoComplete + name based on label/type when not explicitly set.
  // iOS Safari PWA standalone mode is much more reliable about showing the soft
  // keyboard when inputs have name + autoComplete + are wrapped in a <form>.
  const labelLower = (label || '').toLowerCase();
  const slug = (label || placeholder || 'field')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let autoCompleteValue: string | undefined = autoCompleteProp;
  if (autoCompleteValue === undefined) {
    if (inputType === 'email') autoCompleteValue = 'email';
    else if (inputType === 'password') {
      // 'new-password' for confirm/new fields, 'current-password' otherwise
      autoCompleteValue = /confirm|new|create|register|sign.?up/.test(labelLower)
        ? 'new-password'
        : 'current-password';
    } else if (inputType === 'tel') autoCompleteValue = 'tel';
    else if (inputType === 'url') autoCompleteValue = 'url';
    else if (/year/.test(labelLower)) autoCompleteValue = 'bday-year';
    else autoCompleteValue = 'off';
  }

  const fieldName = nameProp || slug;

  // inputMode: default plain text inputs to 'text' (not undefined) so iOS
  // recognises them as keyboard-bearing and shows the soft keyboard.
  const inputModeValue: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'decimal' =
    keyboardType === 'number-pad' || keyboardType === 'numeric'
      ? 'numeric'
      : keyboardType === 'email-address'
      ? 'email'
      : keyboardType === 'phone-pad'
      ? 'tel'
      : keyboardType === 'url'
      ? 'url'
      : 'text';

  // Stable border colour — focus + error states are applied via CSS class
  // (.wk-input:focus and [aria-invalid=true] in the global stylesheet) so the
  // input element does NOT re-render its style attribute when focus changes.
  // iOS Safari can interpret a style change mid-touch as a layout shift and
  // abort soft-keyboard activation.
  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
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

  // Strip userSelect:none from parent chain when input mounts.
  // RNW sets this on wrapper divs which blocks text selection on iOS.
  //
  // IMPORTANT: Do NOT use stopPropagation on touch/pointer/mouse events.
  // iOS uses the full touchstart → touchend event flow to decide whether
  // to show the keyboard. Intercepting these events causes the input to
  // focus (orange border) but the keyboard never appears.
  const inputCallbackRef = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
    if (!el) return;

    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.style.userSelect === 'none') {
        parent.style.userSelect = '';
        (parent.style as any).webkitUserSelect = '';
      }
      parent = parent.parentElement;
    }
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Scroll the focused input into view — iOS Safari is more reliable
      // about presenting the keyboard when the input is already visible.
      try {
        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {}
    },
    [],
  );

  const sharedProps = {
    ref: inputCallbackRef as any,
    className: 'wk-input',
    name: fieldName,
    autoComplete: autoCompleteValue,
    enterKeyHint: 'done' as const,
    spellCheck: inputType === 'password' || inputType === 'email' ? false : undefined,
    value: value ?? '',
    onChange: handleChange,
    placeholder,
    maxLength,
    disabled: editable === false,
    autoCapitalize: autoCapitalizeAttr as any,
    'aria-invalid': error ? true : undefined,
    style: inputStyle,
    onFocus: handleFocus,
    'aria-label': label,
    'aria-describedby': helper ? `${label}-helper` : undefined,
    // Prevent iOS zoom
    'data-testid': `wk-input-${label}`,
  };

  // Wrap in a <form> on web. iOS Safari standalone PWA is significantly more
  // reliable about showing the soft keyboard when inputs live inside a form
  // element. The form has no submit endpoint — preventDefault on submit so a
  // stray Return keypress doesn't reload the page.
  const stopSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      style={containerStyle}
      onSubmit={stopSubmit}
      action="#"
      noValidate
      autoComplete="on"
    >
      {label && (
        <label style={labelStyle} htmlFor={fieldName}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...sharedProps}
          id={fieldName}
          rows={numberOfLines || 3}
        />
      ) : (
        <input
          {...sharedProps}
          id={fieldName}
          type={inputType}
          inputMode={inputModeValue}
        />
      )}
      {error && <div style={errorStyle}>{error}</div>}
      {helper && !error && (
        <div style={helperStyle} id={`${label}-helper`}>
          {helper}
        </div>
      )}
    </form>
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
    backgroundColor: colors.bg,
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
