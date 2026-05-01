import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';

// Deterministic dust particle positions — avoids layout jitter on re-renders.
const DUST = [
  { top: '12%', left: '8%',  size: 3, opacity: 0.18 },
  { top: '22%', left: '78%', size: 2, opacity: 0.12 },
  { top: '35%', left: '18%', size: 4, opacity: 0.10 },
  { top: '48%', left: '88%', size: 2, opacity: 0.14 },
  { top: '60%', left: '5%',  size: 3, opacity: 0.10 },
  { top: '72%', left: '65%', size: 4, opacity: 0.08 },
  { top: '82%', left: '32%', size: 2, opacity: 0.12 },
  { top: '90%', left: '80%', size: 3, opacity: 0.09 },
];

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  iconColor?: string;
};

export function WKEmpty({ icon, title, message, iconColor = colors.amberLine }: Props) {
  return (
    <View style={styles.container}>
      {/* Ambient dust overlay */}
      {DUST.map((p, i) => (
        <View
          key={i}
          style={[styles.dust, {
            top: p.top as any,
            left: p.left as any,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            opacity: p.opacity,
          }]}
        />
      ))}

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
    position: 'relative',
    overflow: 'hidden',
  },
  dust: {
    position: 'absolute',
    backgroundColor: colors.amber,
  },
  title: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  message: { ...typography.bodySm, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
});
