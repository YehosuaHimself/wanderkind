/**
 * In-app browser detection.
 *
 * When wanderkind.love is opened from a link inside Instagram, Facebook,
 * Threads, TikTok, LinkedIn, Snapchat, or X, the page renders inside the
 * social app's embedded webview — NOT iOS Safari. The PWA install flow
 * cannot work there because:
 *
 *   1. The "Add to Home Screen" share button only exists in real Safari.
 *   2. iOS PWA standalone mode cannot be entered from an in-app webview.
 *   3. OAuth providers (Google, Apple) often refuse to authenticate inside
 *      embedded browsers.
 *
 * Use isInAppBrowser() to detect, then show a focused "Open in Safari"
 * prompt instead of the install guide.
 */

export type InAppBrowserName =
  | 'Instagram'
  | 'Facebook'
  | 'Threads'
  | 'TikTok'
  | 'LinkedIn'
  | 'Snapchat'
  | 'X'
  | 'Pinterest'
  | 'Generic';

export function detectInAppBrowser(userAgent?: string): InAppBrowserName | null {
  if (typeof navigator === 'undefined' && !userAgent) return null;
  const ua = userAgent ?? navigator.userAgent ?? '';
  if (!ua) return null;

  // Order matters: more specific markers first.
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'Facebook';
  if (/Barcelona|Threads/i.test(ua)) return 'Threads';
  if (/musical_ly|TikTok/i.test(ua)) return 'TikTok';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/Twitter|TwitterAndroid/i.test(ua)) return 'X';
  if (/Pinterest/i.test(ua)) return 'Pinterest';

  // Generic in-app webview signals — last resort.
  // iOS WebView (non-Safari): no "Safari/" token but has "Mobile/".
  // We avoid false positives on PWA standalone (which also lacks Safari token)
  // by checking for the standalone display mode caller-side.
  return null;
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}
