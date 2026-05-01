import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';

type Props = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

export function WKHeader({ title, showBack = true, rightAction }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      {/* H-LABEL pattern: amber line + courier label */}
      <View style={styles.titleWrap}>
        <View style={styles.amberLine} />
        <Text style={styles.title} numberOfLines={1}>{title.toUpperCase()}</Text>
      </View>

      {rightAction ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    minHeight: 48,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  amberLine: {
    width: 16,
    height: 1.5,
    backgroundColor: colors.amber,
    borderRadius: 1,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.amber,
  },
  spacer: { width: 36 },
});
