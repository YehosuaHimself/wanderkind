import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

// Web fallback for react-native-maps
export default function MapView({ children, style, ...props }: any) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Map</Text>
        <Text style={styles.subtext}>Available on mobile app</Text>
      </View>
      {children}
    </View>
  );
}

export const Marker = ({ children }: any) => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E0D0' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { ...typography.h2, color: colors.ink2 },
  subtext: { ...typography.bodySm, color: colors.ink3, marginTop: 4 },
});
