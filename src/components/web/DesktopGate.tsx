// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Dimensions } from 'react-native';

const useIsDesktop = () => {
  if (Platform.OS !== 'web') return false;
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return false;
  return Dimensions.get('window').width > 1024;
};

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('wk-desktop-styles')) return;

  const style = document.createElement('style');
  style.id = 'wk-desktop-styles';
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --wk-bg:        #FAFAF5;
      --wk-bg2:       #F3EDE0;
      --wk-elevated:  #FFFFFF;
      --wk-ink:       #1A120A;
      --wk-ink-soft:  #6B5A3E;
      --wk-ink-muted: #9A8B73;
      --wk-amber:     #C8762A;
      --wk-amber-hi:  #E09A52;
      --wk-parchment: #F3E7CC;
      --wk-navy:      #080e1f;
      --wk-border:    rgba(200,118,42,0.2);
      --wk-font-display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      --wk-font-body:    'Helvetica Neue', Helvetica, Arial, sans-serif;
      --wk-font-mono:    'Courier New', Courier, monospace;
    }

    html { scroll-behavior: auto; } /* Lenis takes over */

    /* ── GATE ── */
    .wk-gate {
      position: fixed; inset: 0; background: var(--wk-bg);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 1000; cursor: pointer; font-family: var(--wk-font-display);
    }
    .wk-gate-svg { width: 140px; height: 140px; margin-bottom: 32px; }
    .wk-gate-path {
      stroke: var(--wk-amber); stroke-width: 1.5; fill: none;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 600; stroke-dashoffset: 600;
      animation: wk-draw 2.2s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes wk-draw { to { stroke-dashoffset: 0; } }
    .wk-gate-brand {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 28px;
      letter-spacing: -0.02em; text-transform: uppercase; color: var(--wk-ink);
      opacity: 0; animation: wk-stamp .5s ease .9s forwards;
    }
    .wk-gate-brand span { color: var(--wk-amber); }
    @keyframes wk-stamp { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .wk-gate-line {
      width: 0; height: 1px; background: var(--wk-amber);
      margin: 24px auto; animation: wk-expand 1.2s ease 1.1s forwards;
    }
    @keyframes wk-expand { to { width: 180px; } }
    .wk-gate-sub {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--wk-ink-muted);
      opacity: 0; animation: wk-stamp .4s ease 1.5s forwards;
    }
    .wk-gate-skip {
      position: fixed; bottom: 32px; right: 32px;
      font-family: var(--wk-font-mono); font-size: 11px;
      letter-spacing: 0.12em; text-transform: uppercase; color: var(--wk-ink-muted);
      opacity: 0; animation: wk-stamp .4s ease 1.8s forwards;
    }

    /* ── LANDING ── */
    .wk-landing {
      font-family: var(--wk-font-body); background: var(--wk-bg); color: var(--wk-ink);
      min-height: 100vh; overflow-x: hidden; -webkit-font-smoothing: antialiased;
      animation: wk-fadein .7s ease forwards;
    }
    @keyframes wk-fadein { from{opacity:0} to{opacity:1} }

    /* Nav */
    .wk-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 60px;
      background: rgba(250,250,245,.94); backdrop-filter: blur(18px) saturate(1.4);
      border-bottom: 1px solid var(--wk-border);
      transition: background .3s;
    }
    .wk-nav-logo {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 20px;
      letter-spacing: -0.02em; text-transform: uppercase;
      color: var(--wk-ink); text-decoration: none;
    }
    .wk-nav-logo span { color: var(--wk-amber); }
    .wk-nav-links { display: flex; gap: 32px; align-items: center; }
    .wk-nav-link {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.15em;
      color: var(--wk-ink-soft); text-decoration: none; text-transform: uppercase;
      transition: color .2s;
    }
    .wk-nav-link:hover { color: var(--wk-amber); }
    .wk-nav-cta {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 12px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-amber); color: var(--wk-ink);
      padding: 10px 20px; border-radius: 6px; text-decoration: none;
      min-height: 40px; display: flex; align-items: center; transition: background .2s;
      cursor: pointer; border: none;
    }
    .wk-nav-cta:hover { background: var(--wk-amber-hi); }

    /* Hero */
    .wk-hero {
      min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
      align-items: center; padding: 100px 80px 80px; gap: 80px;
      position: relative; overflow: hidden;
    }
    .wk-hero-video-bg {
      position: absolute; inset: 0; z-index: 0;
      overflow: hidden;
    }
    .wk-hero-video-bg video {
      width: 100%; height: 100%; object-fit: cover;
      transform: scale(1.08);
      filter: saturate(0.7) brightness(0.45);
    }
    .wk-hero-video-bg canvas {
      width: 100%; height: 100%; position: absolute; inset: 0;
    }
    .wk-hero-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(
        135deg,
        rgba(26,18,10,0.72) 0%,
        rgba(8,14,31,0.55) 50%,
        rgba(200,118,42,0.08) 100%
      );
    }
    .wk-hero-grain {
      position: absolute; inset: 0; z-index: 2; opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-repeat: repeat; background-size: 128px;
      pointer-events: none;
    }
    .wk-hero-content { position: relative; z-index: 3; }
    .wk-hero-right-wrap { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 28px; }

    .wk-hero-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.25em;
      color: var(--wk-amber); text-transform: uppercase; margin-bottom: 20px;
    }
    .wk-hero-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(44px, 5.2vw, 72px); letter-spacing: -0.03em;
      line-height: 0.95; text-transform: uppercase; color: #FAFAF5; margin-bottom: 24px;
    }
    .wk-hero-title span { color: var(--wk-amber); }
    .wk-hero-body {
      font-family: var(--wk-font-body); font-size: 17px; line-height: 1.7;
      color: rgba(250,250,245,0.72); max-width: 480px; margin-bottom: 40px;
    }
    .wk-hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }

    .wk-btn-primary {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-amber); color: var(--wk-ink);
      padding: 14px 28px; border-radius: 6px; min-height: 48px;
      display: inline-flex; align-items: center; text-decoration: none;
      transition: background .2s; cursor: pointer; border: none;
    }
    .wk-btn-primary:hover { background: var(--wk-amber-hi); }
    .wk-btn-secondary {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: rgba(250,250,245,0.55);
      text-decoration: none; display: flex; align-items: center; gap: 6px;
      transition: color .2s; cursor: pointer; background: none; border: none;
    }
    .wk-btn-secondary:hover { color: var(--wk-amber); }

    /* ── QR BOX (hero right) ── */
    .wk-qr-box {
      background: rgba(255,255,255,0.97);
      border: 1px solid rgba(200,118,42,0.18);
      border-radius: 20px; padding: 36px 32px; text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(200,118,42,0.08);
      backdrop-filter: blur(4px);
    }
    .wk-qr-label {
      font-family: var(--wk-font-body); font-size: 16px;
      color: var(--wk-ink-soft); margin-top: 22px;
    }
    .wk-qr-sub {
      font-family: var(--wk-font-mono); font-size: 11px; color: var(--wk-ink-muted);
      margin-top: 5px; letter-spacing: 0.18em; text-transform: uppercase;
    }
    .wk-phone-hint {
      font-family: var(--wk-font-mono); font-size: 11px;
      color: rgba(250,250,245,0.4); text-align: center;
      letter-spacing: 0.1em; text-transform: uppercase;
    }

    /* Stats */
    .wk-stats {
      background: var(--wk-navy); padding: 56px 80px;
      display: grid; grid-template-columns: repeat(4,1fr); gap: 0;
    }
    .wk-stat { text-align: center; padding: 0 20px; position: relative; }
    .wk-stat:not(:last-child)::after {
      content: ''; position: absolute; right: 0; top: 20%; bottom: 20%;
      width: 1px; background: rgba(255,255,255,.1);
    }
    .wk-stat-num {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 52px;
      letter-spacing: -0.03em; color: var(--wk-amber); line-height: 1;
    }
    .wk-stat-label {
      font-family: var(--wk-font-mono); font-size: 11px;
      color: rgba(255,255,255,.45); margin-top: 8px;
      letter-spacing: 0.15em; text-transform: uppercase;
    }

    /* Values */
    .wk-values { padding: 110px 80px; background: var(--wk-bg); }
    .wk-section-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.25em;
      color: var(--wk-amber); text-transform: uppercase; margin-bottom: 16px; text-align: center;
    }
    .wk-section-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(28px, 3.5vw, 44px); letter-spacing: -0.02em;
      text-transform: uppercase; color: var(--wk-ink);
      text-align: center; margin-bottom: 72px; line-height: 1.05;
    }
    .wk-values-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
    .wk-value {
      padding: 36px; background: var(--wk-elevated);
      border: 0.5px solid rgba(200,118,42,0.18); border-radius: 12px;
      transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s;
    }
    .wk-value:hover { transform: translateY(-6px); box-shadow: 0 24px 72px rgba(0,0,0,.09); }
    .wk-value-icon { width: 48px; height: 48px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
    .wk-value-title {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 18px;
      letter-spacing: -0.01em; text-transform: uppercase; color: var(--wk-ink); margin-bottom: 14px;
    }
    .wk-value-body { font-family: var(--wk-font-body); font-size: 16px; color: var(--wk-ink-soft); line-height: 1.75; }

    /* Quote */
    .wk-quote-section {
      padding: 110px 80px; background: var(--wk-bg2); display: flex; justify-content: center;
    }
    .wk-quote { max-width: 760px; text-align: center; }
    .wk-quote-mark {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 96px;
      color: var(--wk-amber); line-height: .4; display: block; margin-bottom: 24px;
    }
    .wk-quote-text {
      font-family: var(--wk-font-display); font-size: clamp(22px, 3vw, 34px);
      font-weight: 400; color: var(--wk-ink); line-height: 1.55; margin-bottom: 32px;
    }
    .wk-quote-attr {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.18em;
      color: var(--wk-ink-muted); text-transform: uppercase;
    }
    .wk-quote-attr span { color: var(--wk-amber); }

    /* CTA section */
    .wk-cta {
      padding: 110px 80px; background: var(--wk-navy);
      display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
    }
    .wk-cta-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(32px, 4vw, 54px); letter-spacing: -0.03em;
      text-transform: uppercase; color: var(--wk-parchment); line-height: 1.0; margin-bottom: 24px;
    }
    .wk-cta-body {
      font-family: var(--wk-font-body); font-size: 17px;
      color: rgba(243,231,204,.55); line-height: 1.75; margin-bottom: 40px;
    }
    .wk-btn-light {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-parchment); color: var(--wk-ink);
      padding: 14px 28px; border-radius: 6px; min-height: 48px;
      display: inline-flex; align-items: center; text-decoration: none;
      transition: background .2s; cursor: pointer; border: none;
    }
    .wk-btn-light:hover { background: white; }
    .wk-cta-right { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .wk-cta-qr-box {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(200,118,42,0.2);
      border-radius: 20px; padding: 32px; text-align: center;
      backdrop-filter: blur(12px);
    }

    /* Footer */
    .wk-footer {
      background: var(--wk-navy); border-top: 1px solid rgba(255,255,255,.07);
      padding: 32px 80px; display: flex; align-items: center; justify-content: space-between;
    }
    .wk-footer-brand {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 16px;
      letter-spacing: -0.01em; text-transform: uppercase; color: rgba(243,231,204,.3);
    }
    .wk-footer-brand span { color: var(--wk-amber); }
    .wk-footer-tagline {
      font-family: var(--wk-font-mono); font-size: 10px;
      letter-spacing: 0.2em; color: rgba(255,255,255,.22); text-transform: uppercase;
    }

    /* ── QR FULLSCREEN PHASE ── */
    .wk-qr-screen {
      position: fixed; inset: 0; z-index: 500;
      background: var(--wk-bg); display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      animation: wk-fadein .45s ease forwards;
    }
    .wk-qr-screen-back {
      position: fixed; top: 28px; left: 36px;
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--wk-ink-muted); cursor: pointer;
      background: none; border: none; display: flex; align-items: center; gap: 8px;
      transition: color .2s;
    }
    .wk-qr-screen-back:hover { color: var(--wk-amber); }
    .wk-qr-screen-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.28em;
      text-transform: uppercase; color: var(--wk-amber); margin-bottom: 36px;
    }
    .wk-qr-screen-card {
      background: var(--wk-elevated); border-radius: 28px;
      padding: 52px 56px; text-align: center;
      box-shadow: 0 40px 120px rgba(0,0,0,.12), 0 0 0 1px rgba(200,118,42,0.12);
    }
    .wk-qr-screen-url {
      font-family: var(--wk-font-mono); font-size: 16px; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--wk-amber); margin-top: 36px;
      text-decoration: none;
    }
    .wk-qr-screen-hint {
      font-family: var(--wk-font-mono); font-size: 10px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--wk-ink-muted); margin-top: 16px;
    }

    /* Parallax layers */
    .wk-parallax-layer { will-change: transform; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: var(--wk-border); border-radius: 2px; }
  `;
  document.head.appendChild(style);
}

// ── LENIS SMOOTH SCROLL ───────────────────────────────────────────────────────
let lenisInstance = null;
function initLenis() {
  if (typeof window === 'undefined') return;
  if (lenisInstance) return;
  // Load Lenis from CDN if not already present
  if (window.__lenis_loaded) {
    createLenis();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  script.onload = () => {
    window.__lenis_loaded = true;
    createLenis();
  };
  document.head.appendChild(script);
}

function createLenis() {
  try {
    const Lenis = window.Lenis;
    if (!Lenis) return;
    lenisInstance = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    // Lenis not critical — silent fallback
  }
}

function destroyLenis() {
  if (lenisInstance) {
    try { lenisInstance.destroy(); } catch (e) {}
    lenisInstance = null;
  }
}

// ── REAL QR CODE (canvas-rendered, Wanderkind styled) ────────────────────────
function WKQRCode({ size = 220, url = 'https://wanderkind.love', light = '#FAFAF5', dark = '#1A120A', showLogo = true }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    import('qrcode').then(QRCode => {
      if (cancelled || !canvasRef.current) return;

      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark, light },
        errorCorrectionLevel: 'H',
      }, (err) => {
        if (err || cancelled || !canvasRef.current) return;

        // Apply Wanderkind styling over the QR
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const moduleSize = size / 33; // approx cell size for version 3 QR

        // Round the finder patterns (top-left, top-right, bottom-left)
        const finderPositions = [
          [0, 0], [size - 7 * moduleSize, 0], [0, size - 7 * moduleSize]
        ];
        const fp = 7 * moduleSize;

        finderPositions.forEach(([fx, fy]) => {
          // Clear and redraw finder with amber outer square, dark inner
          ctx.clearRect(fx, fy, fp, fp);
          // Outer amber ring
          const r = 3;
          ctx.fillStyle = dark;
          ctx.beginPath();
          roundRect(ctx, fx, fy, fp, fp, r);
          ctx.fill();
          // Inner light square
          ctx.fillStyle = light;
          const pad = moduleSize;
          ctx.beginPath();
          roundRect(ctx, fx + pad, fy + pad, fp - 2 * pad, fp - 2 * pad, 2);
          ctx.fill();
          // Center dark square
          ctx.fillStyle = '#C8762A'; // amber finder center
          const pad2 = moduleSize * 2;
          ctx.beginPath();
          roundRect(ctx, fx + pad2, fy + pad2, fp - 4 * pad2, fp - 4 * pad2, 2);
          ctx.fill();
          // Re-center
          const cSize = fp - 4 * pad2;
          ctx.clearRect(fx + pad2, fy + pad2, fp - 4 * pad2, fp - 4 * pad2);
          ctx.fillStyle = '#C8762A';
          ctx.beginPath();
          roundRect(ctx, fx + moduleSize * 2, fy + moduleSize * 2, moduleSize * 3, moduleSize * 3, 2);
          ctx.fill();
        });

        // W logo in center
        if (showLogo) {
          const logoSize = Math.round(size * 0.18);
          const cx = (size - logoSize) / 2;
          const cy = (size - logoSize) / 2;
          // White backing
          ctx.fillStyle = light;
          ctx.beginPath();
          roundRect(ctx, cx - 4, cy - 4, logoSize + 8, logoSize + 8, 4);
          ctx.fill();
          // Amber W path
          ctx.strokeStyle = '#C8762A';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const w = logoSize;
          ctx.beginPath();
          ctx.moveTo(cx + w * 0.05, cy + w * 0.2);
          ctx.lineTo(cx + w * 0.25, cy + w * 0.8);
          ctx.lineTo(cx + w * 0.5,  cy + w * 0.45);
          ctx.lineTo(cx + w * 0.75, cy + w * 0.8);
          ctx.lineTo(cx + w * 0.95, cy + w * 0.2);
          ctx.stroke();
        }

        setReady(true);
      });
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [url, size, dark, light, showLogo]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        display: 'block',
        opacity: ready ? 1 : 0,
        transition: 'opacity .4s ease',
      }}
    />
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── CINEMATIC CANVAS HERO VIDEO ───────────────────────────────────────────────
function CinematicHero() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let alive = true;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mountain layers (silhouettes)
    const mountains = [
      // [x%, y%, width%, amplitude]
      { color: '#080e1f', yBase: 0.72, pts: makeMountain(0, 0.72, 1, 0.32, 12, 7) },
      { color: '#0d1530', yBase: 0.78, pts: makeMountain(0, 0.78, 1, 0.20, 10, 42) },
      { color: '#161f3d', yBase: 0.84, pts: makeMountain(0, 0.84, 1, 0.12, 8, 19) },
      { color: '#1e2a4a', yBase: 0.89, pts: makeMountain(0, 0.89, 1, 0.08, 6, 88) },
    ];

    // Stars
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random(), y: Math.random() * 0.65,
      r: Math.random() * 1.2 + 0.3,
      blink: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.3,
    }));

    // Walking path
    const pathPts = [
      [0.48, 1.0], [0.49, 0.92], [0.50, 0.88],
      [0.52, 0.84], [0.51, 0.80], [0.53, 0.76],
    ];

    function draw(ts) {
      if (!alive) return;
      frameRef.current = requestAnimationFrame(draw);
      const elapsed = (Date.now() - startRef.current) / 1000;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient — navy dawn transitioning to amber horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.88);
      const t = (Math.sin(elapsed * 0.04) + 1) / 2; // very slow oscillation
      skyGrad.addColorStop(0, `hsl(${220 + t * 5}, 45%, ${6 + t * 3}%)`);
      skyGrad.addColorStop(0.45, `hsl(${210 + t * 8}, 40%, ${10 + t * 4}%)`);
      skyGrad.addColorStop(0.75, `hsl(${25 + t * 10}, ${40 + t * 15}%, ${15 + t * 8}%)`);
      skyGrad.addColorStop(1, `hsl(${20}, ${50 + t * 10}%, ${22 + t * 6}%)`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.88);

      // Amber glow at horizon
      const glowX = W * (0.35 + Math.sin(elapsed * 0.02) * 0.05);
      const glow = ctx.createRadialGradient(glowX, H * 0.82, 0, glowX, H * 0.82, W * 0.5);
      glow.addColorStop(0, `rgba(200,118,42,${0.18 + t * 0.1})`);
      glow.addColorStop(0.4, `rgba(200,118,42,${0.06 + t * 0.04})`);
      glow.addColorStop(1, 'rgba(200,118,42,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        const alpha = (0.4 + 0.6 * Math.sin(s.blink + elapsed * s.speed * 0.7)) * (1 - t * 0.4);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,220,${alpha})`;
        ctx.fill();
      });

      // Mountain layers with subtle parallax drift
      mountains.forEach((m, i) => {
        const drift = Math.sin(elapsed * 0.008 + i * 0.5) * W * 0.003;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(0, H);
        m.pts.forEach((p, pi) => {
          const px = (p[0] + drift / W) * W;
          const py = p[1] * H;
          if (pi === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      });

      // Ground / path
      const groundGrad = ctx.createLinearGradient(0, H * 0.88, 0, H);
      groundGrad.addColorStop(0, '#0d0a06');
      groundGrad.addColorStop(1, '#060402');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.88, W, H * 0.12);

      // Path / trail line
      ctx.save();
      ctx.strokeStyle = `rgba(200,118,42,${0.22 + t * 0.12})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 12]);
      ctx.lineDashOffset = -elapsed * 12;
      ctx.beginPath();
      pathPts.forEach((p, i) => {
        const px = p[0] * W, py = p[1] * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      // Film grain overlay
      const grain = ctx.createImageData(W, H);
      for (let i = 0; i < grain.data.length; i += 4) {
        const g = (Math.random() - 0.5) * 28;
        grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = 128 + g;
        grain.data[i + 3] = 14;
      }
      ctx.putImageData(grain, 0, 0);
    }

    requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}

function makeMountain(x0, y0, x1, h, peaks, seed) {
  const pts = [[x0, y0]];
  const count = peaks * 3;
  for (let i = 1; i <= count; i++) {
    const x = x0 + (x1 - x0) * (i / count);
    const noise = Math.sin(i * 2.3 + seed) * 0.5 + Math.sin(i * 1.1 + seed * 0.7) * 0.3 + Math.sin(i * 3.7 + seed * 0.3) * 0.2;
    const y = y0 - h * Math.max(0, noise * 0.5 + 0.5);
    pts.push([x, y]);
  }
  pts.push([x1, y0]);
  return pts;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IconDoor = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8762A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/>
    <line x1="3" y1="21" x2="21" y2="21"/>
    <path d="M9 21V9h6v12"/>
    <circle cx="15" cy="15" r="0.5" fill="#C8762A"/>
  </svg>
);
const IconCompass = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8762A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M16.24 7.76l-3.18 6.36-6.36 3.18 3.18-6.36 6.36-3.18z"/>
  </svg>
);
const IconPath = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8762A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20C4 20 6 14 10 12C14 10 16 14 20 12"/>
    <path d="M4 12C4 12 6 6 10 4C14 2 18 6 20 4"/>
    <line x1="4" y1="20" x2="4" y2="4"/>
  </svg>
);

// ── QR FULLSCREEN PHASE ───────────────────────────────────────────────────────
function QRScreen({ onBack }) {
  return (
    <div className="wk-qr-screen">
      <button className="wk-qr-screen-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>
      <div className="wk-qr-screen-eyebrow">&mdash; Open on your phone &mdash;</div>
      <div className="wk-qr-screen-card">
        <WKQRCode size={340} url="https://wanderkind.love" showLogo={true} />
        <a className="wk-qr-screen-url" href="https://wanderkind.love" target="_blank">
          WWW.WANDERKIND.LOVE
        </a>
        <div className="wk-qr-screen-hint">Point your camera · No app required</div>
      </div>
    </div>
  );
}

// ── GATE PHASE ────────────────────────────────────────────────────────────────
function GatePhase({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="wk-gate" onClick={onDone}>
      <svg className="wk-gate-svg" viewBox="0 0 140 140" fill="none">
        <path className="wk-gate-path" d="M20 28 L40 108 L70 58 L100 108 L120 28"/>
      </svg>
      <div className="wk-gate-brand">WANDER<span>KIND</span></div>
      <div className="wk-gate-line"/>
      <div className="wk-gate-sub">Walk further. Stay together.</div>
      <div className="wk-gate-skip">Tap to continue &rarr;</div>
    </div>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({ onQR }) {
  const statsRef = useRef(null);
  const valuesRef = useRef(null);
  const quoteRef = useRef(null);

  // Parallax on scroll
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (statsRef.current) {
          statsRef.current.style.transform = `translateY(${scrollY * 0.04}px)`;
        }
        if (valuesRef.current) {
          valuesRef.current.style.transform = `translateY(${scrollY * -0.02}px)`;
        }
        if (quoteRef.current) {
          quoteRef.current.style.transform = `translateY(${scrollY * 0.015}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="wk-landing">
      {/* Nav */}
      <nav className="wk-nav">
        <a className="wk-nav-logo" href="#">WANDER<span>KIND</span></a>
        <div className="wk-nav-links">
          <a className="wk-nav-link" href="#values">The Way</a>
          <a className="wk-nav-link" href="#community">Community</a>
          <a className="wk-nav-link" href="#join">Join</a>
          <button className="wk-nav-cta" onClick={onQR}>Open on Mobile</button>
        </div>
      </nav>

      {/* Hero with cinematic canvas */}
      <section className="wk-hero" id="hero">
        <div className="wk-hero-video-bg">
          <CinematicHero />
        </div>
        <div className="wk-hero-overlay"/>
        <div className="wk-hero-grain"/>

        <div className="wk-hero-content wk-parallax-layer">
          <div className="wk-hero-eyebrow">&mdash; Free &middot; Community &middot; Open Road</div>
          <h1 className="wk-hero-title">
            Walk further.<br /><span>Stay together.</span>
          </h1>
          <p className="wk-hero-body">
            WANDERKIND is the community app for long-distance walkers and travellers.
            Find a bed in a stranger's home tonight. Share your route.
            Move through the world on your own terms.
          </p>
          <div className="wk-hero-actions">
            <button className="wk-btn-primary" onClick={onQR}>Scan to open on mobile</button>
            <button className="wk-btn-secondary" onClick={onQR}>Open WANDERKIND &rarr;</button>
          </div>
        </div>

        <div className="wk-hero-right-wrap" id="join">
          <div className="wk-qr-box">
            <WKQRCode size={200} url="https://wanderkind.love" showLogo={true} />
            <div className="wk-qr-label">Scan to open WANDERKIND</div>
            <div className="wk-qr-sub">wanderkind.love</div>
          </div>
          <div className="wk-phone-hint">Point your phone camera at the code above</div>
        </div>
      </section>

      {/* Stats */}
      <div className="wk-stats wk-parallax-layer" ref={statsRef}>
        <div className="wk-stat"><div className="wk-stat-num">26+</div><div className="wk-stat-label">Routes mapped</div></div>
        <div className="wk-stat"><div className="wk-stat-num">Free</div><div className="wk-stat-label">Always &amp; forever</div></div>
        <div className="wk-stat"><div className="wk-stat-num">&infin;</div><div className="wk-stat-label">Kilometres walked</div></div>
        <div className="wk-stat"><div className="wk-stat-num">1</div><div className="wk-stat-label">Rule: walk</div></div>
      </div>

      {/* Values */}
      <section className="wk-values wk-parallax-layer" id="values" ref={valuesRef}>
        <div className="wk-section-eyebrow">&mdash; The WANDERKIND Way</div>
        <h2 className="wk-section-title">Built for everyone<br />who moves with intention.</h2>
        <div className="wk-values-grid">
          <div className="wk-value">
            <div className="wk-value-icon"><IconDoor /></div>
            <div className="wk-value-title">Open Doors</div>
            <p className="wk-value-body">Community hosts open their homes to fellow Wanderkinder. No payment, no middleman. A bed, a meal, a conversation. The oldest form of hospitality — made findable.</p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon"><IconCompass /></div>
            <div className="wk-value-title">The Route First</div>
            <p className="wk-value-body">Every feature is designed around the journey, not the screen. Maps that work offline at 2000m. Stage planning that understands the logic of long-distance travel.</p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon"><IconPath /></div>
            <div className="wk-value-title">Walk Your Own Way</div>
            <p className="wk-value-body">No algorithm. No ads. No data sold. Your route, your memories, your community — entirely yours. Privacy by default. Simplicity by design.</p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="wk-quote-section wk-parallax-layer" id="community" ref={quoteRef}>
        <div className="wk-quote">
          <span className="wk-quote-mark">&ldquo;</span>
          <p className="wk-quote-text">
            Nothing can go wrong when you put the right foot in front of the other.
          </p>
          <div className="wk-quote-attr">
            YEHOSUA HIMSELF &middot; <span>WANDERKIND FOUNDER</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="wk-cta">
        <div>
          <h2 className="wk-cta-title">Your next stage<br />starts here.</h2>
          <p className="wk-cta-body">
            Open on your phone. Find a host for tonight.
            Walk tomorrow. This is the whole app.
            Nothing more is needed.
          </p>
          <button className="wk-btn-light" onClick={onQR}>Open WANDERKIND &rarr;</button>
        </div>
        <div className="wk-cta-right">
          <div className="wk-cta-qr-box">
            <WKQRCode size={160} url="https://wanderkind.love" light="#ffffff" dark="#1A120A" showLogo={true} />
            <div style={{ fontFamily:"'Courier New',monospace", fontSize:10, color:'rgba(200,118,42,0.7)', marginTop:16, letterSpacing:'.18em', textTransform:'uppercase' }}>
              wanderkind.love
            </div>
          </div>
          <div style={{ fontFamily:"'Courier New',monospace", fontSize:10, color:'rgba(255,255,255,.25)', textAlign:'center', letterSpacing:'.15em', textTransform:'uppercase' }}>
            Point your camera to open
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="wk-footer">
        <div className="wk-footer-brand">WANDER<span>KIND</span></div>
        <div className="wk-footer-tagline">Wander &middot; Connect &middot; Rest</div>
        <div className="wk-footer-tagline">&copy; 2026 WANDERKIND</div>
      </footer>
    </div>
  );
}

// ── ROOT EXPORT ───────────────────────────────────────────────────────────────
export function DesktopGate({ children }) {
  const [phase, setPhase] = useState('gate');
  const [, setTick] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    injectStyles();
    const handler = () => setTick(n => n + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Init Lenis when entering landing phase; destroy on exit
  useEffect(() => {
    if (phase === 'landing') {
      initLenis();
    } else {
      destroyLenis();
    }
  }, [phase]);

  if (!isDesktop) return <>{children}</>;

  return (
    <>
      {phase === 'gate' && <GatePhase onDone={() => setPhase('landing')} />}
      {phase === 'landing' && (
        <LandingPage onQR={() => setPhase('qr')} />
      )}
      {phase === 'qr' && (
        <QRScreen onBack={() => setPhase('landing')} />
      )}
    </>
  );
}
