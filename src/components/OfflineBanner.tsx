import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Shows a slim banner at the top when the user is offline.
 * Drop this into any layout wrapper.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline — some features may not work</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#92400E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 9998,
  },
  text: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
