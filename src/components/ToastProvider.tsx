import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { onToast } from '../lib/toast';
import { colors } from '../lib/theme';

interface ToastItem {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  duration: number;
  opacity: Animated.Value;
}

const TYPE_CONFIG = {
  error: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', icon: '⚠' },
  success: { bg: '#DCFCE7', border: '#16A34A', text: '#166534', icon: '✓' },
  info: { bg: '#DBEAFE', border: '#2563EB', text: '#1E40AF', icon: 'ℹ' },
  warning: { bg: '#FEF3C7', border: '#D97706', text: '#92400E', icon: '!' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts(prev => {
      const item = prev.find(t => t.id === id);
      if (item) {
        Animated.timing(item.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          setToasts(p => p.filter(t => t.id !== id));
        });
      }
      return prev;
    });
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  useEffect(() => {
    const unsub = onToast(toast => {
      const opacity = new Animated.Value(0);
      const item: ToastItem = { ...toast, opacity };

      setToasts(prev => [...prev.slice(-2), item]); // Keep max 3

      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      timers.current[toast.id] = setTimeout(() => removeToast(toast.id), toast.duration);
    });

    return () => {
      unsub();
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [removeToast]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map(t => {
          const config = TYPE_CONFIG[t.type];
          return (
            <Animated.View
              key={t.id}
              style={[
                styles.toast,
                { backgroundColor: config.bg, borderLeftColor: config.border, opacity: t.opacity },
              ]}
            >
              <Text style={[styles.icon, { color: config.border }]}>{config.icon}</Text>
              <Text style={[styles.message, { color: config.text }]} numberOfLines={3}>
                {t.message}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
