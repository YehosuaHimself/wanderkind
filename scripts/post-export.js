#!/usr/bin/env node
/**
 * Post-export script for Wanderkind PWA
 *
 * Expo's static export (npx expo export --platform web) uses its own HTML
 * template that doesn't include our custom +html.tsx. This means the
 * production index.html is missing critical PWA meta tags, manifest link,
 * and viewport configuration.
 *
 * This script patches dist/index.html after export to add everything needed
 * for a properly functioning iOS PWA with keyboard support.
 *
 * Usage: node scripts/post-export.js
 * (automatically called by: npm run build:web)
 */

const fs = require('fs');
const path = require('path');

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distHtml)) {
  console.error('❌ dist/index.html not found. Run "npx expo export --platform web" first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf8');

// 1. Fix viewport meta tag — add viewport-fit=cover for iOS safe areas
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />'
);

// 2. Inject PWA meta tags before </head>
const pwaMeta = `
    <!-- PWA: Apple iOS -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Wanderkind" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- PWA: Android/Chrome -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="Wanderkind" />
    <meta name="theme-color" content="#C8762A" />

    <!-- PWA: Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- PWA: Microsoft -->
    <meta name="msapplication-TileColor" content="#C8762A" />
    <meta name="msapplication-TileImage" content="/icon-144.png" />
`;

html = html.replace('</head>', pwaMeta + '  </head>');

// 3. Remove body { overflow: hidden } from expo-reset — it blocks
//    the virtual keyboard in iOS WKWebView standalone mode
html = html.replace(
  /\/\* These styles disable body scrolling.*?\*\/\s*body\s*\{\s*overflow:\s*hidden;\s*\}/s,
  '/* overflow:hidden removed — blocks keyboard in iOS PWA standalone */'
);

// 4. Add inline script BEFORE the bundle to fix keyboard in standalone mode
// This runs before React/RNW load, ensuring maximum compatibility
const earlyFix = `
    <script>
      // Early PWA fix: runs before React bundle loads
      (function() {
        var standalone = window.navigator.standalone === true ||
          window.matchMedia('(display-mode: standalone)').matches;
        if (standalone) {
          // Ensure body never gets overflow:hidden
          var style = document.createElement('style');
          style.textContent = 'body { overflow: auto !important; } ' +
            'input, textarea, select { -webkit-user-select: text !important; ' +
            'user-select: text !important; font-size: 16px !important; }';
          document.head.appendChild(style);
        }
      })();
    </script>
`;

// Insert early fix script before the bundle script
html = html.replace(
  /(<script src="\/_expo)/,
  earlyFix + '  $1'
);

fs.writeFileSync(distHtml, html, 'utf8');

console.log('✅ dist/index.html patched with PWA meta tags and keyboard fix');
