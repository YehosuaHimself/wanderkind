import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML document for Expo Router web export.
 * Full PWA support: manifest, service worker registration, Apple + Android + Chrome meta tags.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA Manifest — required by all browsers */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color — Chrome uses this for address bar + splash screen */}
        <meta name="theme-color" content="#C8762A" />

        {/* Chrome / Android PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Wanderkind" />

        {/* Apple / iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wanderkind" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Microsoft / Windows PWA meta tags */}
        <meta name="msapplication-TileColor" content="#C8762A" />
        <meta name="msapplication-TileImage" content="/icon-144.png" />

        {/* Standard favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />

        {/* Prevent body scrolling + full-height layout */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body { height: 100%; }
          body { overflow: hidden; }
          #root { display: flex; height: 100%; flex: 1; }

          /* === iOS PWA text input fix === */
          /* React Native Web sets user-select: none as inline styles on
             wrapper divs. In iOS standalone/PWA mode this prevents the
             keyboard from appearing. We override EVERYTHING and let the
             more specific input rules below re-enable selection. */
          * {
            -webkit-user-select: auto !important;
            user-select: auto !important;
          }
          input, textarea, select, [contenteditable="true"] {
            -webkit-user-select: text !important;
            user-select: text !important;
            -webkit-appearance: none !important;
            touch-action: manipulation !important;
          }
        `}} />

        {/* Runtime fix: strip user-select:none from all input ancestors in PWA mode */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Only needed in iOS standalone (PWA) mode
            var isStandalone = window.navigator.standalone === true ||
              window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) return;

            // Force user-select on all ancestors of inputs
            function fixInputAncestors() {
              var inputs = document.querySelectorAll('input, textarea, select');
              for (var i = 0; i < inputs.length; i++) {
                var el = inputs[i];
                while (el && el !== document.body) {
                  if (el.style && el.style.userSelect === 'none') {
                    el.style.userSelect = '';
                    el.style.webkitUserSelect = '';
                  }
                  el = el.parentElement;
                }
              }
            }

            // Run on any DOM change (catches React renders)
            var observer = new MutationObserver(function() {
              fixInputAncestors();
            });

            // Start observing once DOM is ready
            if (document.body) {
              observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
              fixInputAncestors();
            } else {
              document.addEventListener('DOMContentLoaded', function() {
                observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
                fixInputAncestors();
              });
            }

            // Also intercept focus on inputs to force-fix right before keyboard
            document.addEventListener('focusin', function(e) {
              var t = e.target;
              if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
                var el = t;
                while (el && el !== document.body) {
                  if (el.style) {
                    el.style.userSelect = '';
                    el.style.webkitUserSelect = '';
                  }
                  el = el.parentElement;
                }
                // Re-trigger focus after style cleanup
                setTimeout(function() { t.focus(); }, 0);
              }
            }, true);
          })();
        `}} />
      </head>
      <body>
        {children}

        {/* Register service worker — CRITICAL for Chrome/Android install prompt */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
