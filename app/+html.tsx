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
