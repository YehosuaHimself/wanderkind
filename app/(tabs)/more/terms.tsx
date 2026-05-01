/**
 * /(tabs)/more/terms — redirect shim to legal/terms.tsx
 * Wanderhost screen pushes this route; the actual content lives in legal/.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TermsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/more/legal/terms' as any);
  }, []);
  return null;
}
