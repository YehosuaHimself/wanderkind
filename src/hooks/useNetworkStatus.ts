import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Lightweight online/offline detection.
 * - Web: uses navigator.onLine + online/offline events
 * - Native: uses a simple fetch ping as fallback
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);

      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);

      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    // Native fallback: periodic ping against our own Supabase instance
    let mounted = true;
    const HEALTH_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gjzhwpzgvdpkflgjesmb.supabase.co') + '/rest/v1/';
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(HEALTH_URL, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        if (mounted) setIsOnline(true);
      } catch {
        if (mounted) setIsOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 30000); // 30s — gentler on battery

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
