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

// 4. Add inline styles + script BEFORE the bundle to fix keyboard on iOS
// React Native Web sets user-select: none as inline styles which blocks
// iOS virtual keyboard. We override globally and strip inline styles at runtime.
const earlyFix = `
    <style>
      /* iOS keyboard fix: override RNW user-select:none globally */
      * { -webkit-user-select: auto !important; user-select: auto !important; }
      input, textarea, select, [contenteditable="true"] {
        -webkit-user-select: text !important;
        user-select: text !important;
        -webkit-appearance: none !important;
        touch-action: manipulation !important;
        font-size: 16px !important;
      }
    </style>
    <script>
      // Runtime fix: strip user-select:none from input ancestors on focus
      (function() {
        // Standalone PWA: also fix overflow
        var standalone = window.navigator.standalone === true ||
          window.matchMedia('(display-mode: standalone)').matches;
        if (standalone) {
          var s = document.createElement('style');
          s.textContent = 'body { overflow: auto !important; }';
          document.head.appendChild(s);
        }

        // Strip user-select:none from all ancestors when input is focused
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
          }
        }, true);
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
