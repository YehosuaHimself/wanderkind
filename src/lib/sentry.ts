/**
 * Sentry error monitoring — WANDERKIND
 *
 * Initialise once at app boot (called from app/_layout.tsx).
 * The DSN is set via EXPO_PUBLIC_SENTRY_DSN environment variable.
 * Without a DSN, Sentry is silently disabled — safe for local dev.
 *
 * To activate:
 *   1. Create account at https://sentry.io (free tier is sufficient)
 *   2. Create a React Native project
 *   3. Add the DSN to GitHub Secrets as EXPO_PUBLIC_SENTRY_DSN
 *   4. Add to .env.example: EXPO_PUBLIC_SENTRY_DSN=your_dsn_here
 */

import { Platform } from 'react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let Sentry: typeof import('@sentry/react-native') | null = null;

export async function initSentry() {
  if (!DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured — monitoring disabled');
    return;
  }

  try {
    Sentry = await import('@sentry/react-native');
    Sentry.init({
      dsn: DSN,
      environment: process.env.EXPO_PUBLIC_ENV || 'production',
      // Only sample 20% of performance transactions — crashes always reported
      tracesSampleRate: 0.2,
      // Don't send PII
      beforeSend(event) {
        // Strip user email from breadcrumbs for GDPR compliance
        if (event.user?.email) {
          event.user = { id: event.user.id };
        }
        return event;
      },
      integrations: [
        // Don't include native integrations on web — they crash
        ...(Platform.OS !== 'web' ? [] : []),
      ],
    });
    if (__DEV__) console.log('[Sentry] Initialized');
  } catch (err) {
    // Never let Sentry init crash the app
    console.warn('[Sentry] Failed to initialize:', err);
  }
}

/** Report an error manually — safe to call even if Sentry isn't initialized */
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (!Sentry) return;
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/** Set user context after sign-in — use trail name not email for GDPR */
export function setSentryUser(id: string, trailName: string) {
  if (!Sentry) return;
  Sentry.setUser({ id, username: trailName });
}

/** Clear user on sign-out */
export function clearSentryUser() {
  if (!Sentry) return;
  Sentry.setUser(null);
}
