import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { colors, radii } from '../../lib/theme';
import { detectInAppBrowser } from '../../lib/in-app-browser';

/**
 * InAppBrowserPrompt — full-screen "Open in Safari" UI shown when the page
 * is loaded inside Instagram / Facebook / TikTok / etc. embedded webviews.
 *
 * Rendered via React Portal directly into <body> (same approach as
 * WebAuthScreen) so styling and behaviour are independent of the rest of
 * the React Native Web tree.
 *
 * The prompt:
 *   - Names the social app the user is in (so the situation feels recognised)
 *   - Provides a one-tap copy of the URL
 *   - Shows visual instructions for the ⋯ menu → "Open in External Browser"
 *   - Falls back gracefully on browsers that don't expose the menu
 */
export function InAppBrowserPrompt() {
  const browser = detectInAppBrowser();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : 'wanderkind.love';
  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('https://wanderkind.love');
      } else {
        // Fallback for older webviews that don't expose async clipboard.
        const ta = document.createElement('textarea');
        ta.value = 'https://wanderkind.love';
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }, []);

  if (!browser || typeof document === 'undefined') return null;

  // === Inline styles (no RN, no Tailwind — clean DOM) ===
  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.bg,
    overflowY: 'auto',
    overflowX: 'hidden',
    zIndex: 999999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: colors.ink,
    padding: 24,
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const card: React.CSSProperties = {
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  };

  const logoCircle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.amber,
    color: '#fff',
    fontSize: 32,
    fontWeight: 600,
    fontFamily: 'Georgia, serif',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  };

  const title: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    color: colors.ink,
    margin: '0 0 12px',
    lineHeight: 1.25,
  };

  const subtitle: React.CSSProperties = {
    fontSize: 15,
    color: colors.ink2,
    margin: '0 0 28px',
    lineHeight: 1.55,
  };

  const stepRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    textAlign: 'left',
    padding: '14px 16px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLt}`,
    borderRadius: radii.md,
    marginBottom: 12,
  };

  const stepNumber: React.CSSProperties = {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.amber,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const stepText: React.CSSProperties = {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 1.5,
  };

  const stepHint: React.CSSProperties = {
    fontSize: 13,
    color: colors.ink3,
    marginTop: 4,
    lineHeight: 1.4,
  };

  const copyBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: copied ? '#3a8a3a' : colors.amber,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 20,
    transition: 'background-color 200ms',
  };

  const urlLine: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
    padding: '8px 14px',
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderLt}`,
    marginTop: 16,
  };

  const footer: React.CSSProperties = {
    fontSize: 12,
    color: colors.ink3,
    marginTop: 28,
    lineHeight: 1.5,
  };

  return createPortal(
    <div style={overlay}>
      <div style={card}>
        <span style={logoCircle}>W</span>

        <h1 style={title}>Open Wanderkind in your browser</h1>

        <p style={subtitle}>
          You opened this from {browser}. Wanderkind needs your real browser
          (Safari) so it can be installed on your home screen and so sign-in
          works correctly.
        </p>

        <div style={stepRow}>
          <span style={stepNumber}>1</span>
          <div>
            <div style={stepText}>Tap the <strong>⋯</strong> menu</div>
            <div style={stepHint}>Top-right corner of this screen</div>
          </div>
        </div>

        <div style={stepRow}>
          <span style={stepNumber}>2</span>
          <div>
            <div style={stepText}>
              Tap <strong>"Open in External Browser"</strong>
              {browser === 'Instagram' && ' or "Open in Browser"'}
            </div>
            <div style={stepHint}>Safari will open with this page</div>
          </div>
        </div>

        <button type="button" style={copyBtn} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy wanderkind.love'}
        </button>

        <div style={urlLine}>{cleanUrl || 'wanderkind.love'}</div>

        <p style={footer}>
          Tip: paste the link into Safari directly if the menu isn't visible.
        </p>
      </div>
    </div>,
    document.body
  );
}
