import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';

/**
 * Auth guard hook — redirects to welcome screen if no session exists.
 * Use at the top of every protected (tabs) screen.
 * Returns { user, profile, isLoading } for convenience.
 *
 * Web-safe: defers redirect via requestAnimationFrame and wraps in try/catch
 * to prevent crashes when screens are still mounting inside Stack navigators.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { session, user, profile, isLoading } = useAuthStore();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !session && !hasRedirected.current) {
      hasRedirected.current = true;

      // Defer redirect to next frame so the current render cycle completes
      const doRedirect = () => {
        try {
          router.replace('/(auth)/welcome' as any);
        } catch {
          // Navigation failed — screen may have unmounted or router not ready
          hasRedirected.current = false;
        }
      };

      if (Platform.OS === 'web') {
        requestAnimationFrame(doRedirect);
      } else {
        doRedirect();
      }
    }

    // Reset flag when session becomes available again
    if (session) {
      hasRedirected.current = false;
    }
  }, [isLoading, session]);

  return { user, profile, isLoading, session, isAuthenticated: !!session };
}
