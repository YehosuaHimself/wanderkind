import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML document for Expo Router web export.
 * Adds PWA manifest, Apple meta tags, and theme color for standalone mode.
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

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color — matches Wanderkind amber */}
        <meta name="theme-color" content="#C8762A" />

        {/* Apple PWA meta tags — CRITICAL for iOS standalone mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wanderkind" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Standard favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Prevent body scrolling + full-height layout */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body { height: 100%; }
          body { overflow: hidden; }
          #root { display: flex; height: 100%; flex: 1; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
