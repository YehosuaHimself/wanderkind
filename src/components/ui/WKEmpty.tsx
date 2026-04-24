import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  iconColor?: string;
};

export function WKEmpty({ icon, title, message, iconColor = colors.amberLine }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={48} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 48,
    gap: 8,
  },
  title: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  message: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
});
