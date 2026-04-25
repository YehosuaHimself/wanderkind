import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/auth';

/**
 * Auth guard hook — redirects to welcome screen if no session exists.
 * Use at the top of every protected (tabs) screen.
 * Returns { user, profile, isLoading } for convenience.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { session, user, profile, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/welcome' as any);
    }
  }, [isLoading, session]);

  return { user, profile, isLoading, session, isAuthenticated: !!session };
}
