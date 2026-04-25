import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Platform } from 'react-native';
import { colors, radii, typography } from '../../lib/theme';

// expo-haptics doesn't work on web
let Haptics: any = null;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch {}
}

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
};

export function WKButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: Props) {
  const handlePress = () => {
    if (Haptics) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : colors.amber} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    gap: 8,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },

  // Variants
  primary: { backgroundColor: colors.amber },
  secondary: { backgroundColor: colors.surfaceAlt },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.redBg, borderWidth: 1, borderColor: 'rgba(176,58,58,0.18)' },

  // Sizes — all meet WCAG 44px minimum touch target
  size_sm: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
  size_md: { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 52 },

  // Text — guidelines V3 §07: "Helvetica 700 14px uppercase" for buttons
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  text_primary: { color: '#FFFFFF' },
  text_secondary: { color: colors.ink },
  text_outline: { color: colors.amber },
  text_ghost: { color: colors.amber },
  text_danger: { color: colors.red },

  textSize_sm: { fontSize: 10 },
  textSize_md: { fontSize: 11 },
  textSize_lg: { fontSize: 12 },
});
