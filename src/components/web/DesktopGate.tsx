// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
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

    html { scroll-behavior: auto; }

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

    .wk-landing {
      font-family: var(--wk-font-body); background: var(--wk-bg); color: var(--wk-ink);
      min-height: 100vh; overflow-x: hidden; -webkit-font-smoothing: antialiased;
      animation: wk-fadein .7s ease forwards;
    }
    @keyframes wk-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    .wk-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 60px;
      background: rgba(250,250,245,.96); backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--wk-border);
    }
    .wk-nav-logo {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 20px;
      letter-spacing: -0.02em; text-transform: uppercase; color: var(--wk-ink); text-decoration: none;
    }
    .wk-nav-logo span { color: var(--wk-amber); }
    .wk-nav-links { display: flex; gap: 32px; align-items: center; }
    .wk-nav-link {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.15em;
      color: var(--wk-ink-soft); text-decoration: none; text-transform: uppercase; transition: color .2s;
    }
    .wk-nav-link:hover { color: var(--wk-amber); }
    .wk-nav-cta {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 12px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-amber); color: var(--wk-ink);
      padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;
      min-height: 40px; display: flex; align-items: center; transition: background .2s;
    }
    .wk-nav-cta:hover { background: var(--wk-amber-hi); }

    .wk-hero {
      min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
      align-items: center; padding: 100px 80px 80px; gap: 80px;
      background: linear-gradient(160deg, var(--wk-bg) 55%, var(--wk-bg2) 100%);
      position: relative; overflow: hidden;
    }
    .wk-hero::after {
      content: ''; position: absolute; top: -40px; right: -80px;
      width: 500px; height: 500px; border-radius: 50%;
      background: radial-gradient(circle,rgba(200,118,42,.06),transparent 70%);
      pointer-events: none;
    }
    .wk-hero-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.25em;
      color: var(--wk-amber); text-transform: uppercase; margin-bottom: 20px;
    }
    .wk-hero-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(42px, 5vw, 68px); letter-spacing: -0.03em;
      line-height: 0.95; text-transform: uppercase; color: var(--wk-ink); margin-bottom: 24px;
    }
    .wk-hero-title span { color: var(--wk-amber); }
    .wk-hero-body {
      font-family: var(--wk-font-body); font-size: 16px; line-height: 1.7;
      color: var(--wk-ink-soft); max-width: 460px; margin-bottom: 40px;
    }
    .wk-hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .wk-btn-primary {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-ink); color: var(--wk-parchment);
      padding: 14px 28px; border-radius: 6px; border: none; cursor: pointer;
      min-height: 48px; display: inline-flex; align-items: center; transition: background .2s;
    }
    .wk-btn-primary:hover { background: #2A1E10; }
    .wk-btn-secondary {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--wk-ink-soft); text-decoration: none;
      display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer;
    }
    .wk-btn-secondary:hover { color: var(--wk-amber); }

    .wk-hero-right { display: flex; flex-direction: column; align-items: center; gap: 28px; }
    .wk-qr-box {
      background: var(--wk-elevated); border: 0.5px solid rgba(200,118,42,0.2);
      border-radius: 16px; padding: 32px; text-align: center;
      box-shadow: 0 16px 48px rgba(0,0,0,.06);
    }
    .wk-qr-label { font-family: var(--wk-font-body); font-size: 16px; color: var(--wk-ink-soft); margin-top: 20px; }
    .wk-qr-sub {
      font-family: var(--wk-font-mono); font-size: 11px; color: var(--wk-ink-muted);
      margin-top: 4px; letter-spacing: 0.15em; text-transform: uppercase;
    }
    .wk-phone-hint {
      font-family: var(--wk-font-mono); font-size: 11px; color: var(--wk-ink-muted);
      text-align: center; letter-spacing: 0.1em; text-transform: uppercase;
    }

    .wk-stats {
      background: var(--wk-navy); padding: 48px 80px;
      display: grid; grid-template-columns: repeat(4,1fr); gap: 0;
      will-change: transform;
    }
    .wk-stat { text-align: center; padding: 0 20px; position: relative; }
    .wk-stat:not(:last-child)::after {
      content: ''; position: absolute; right: 0; top: 20%; bottom: 20%;
      width: 1px; background: rgba(255,255,255,.12);
    }
    .wk-stat-num {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 52px;
      letter-spacing: -0.03em; color: var(--wk-amber); line-height: 1;
    }
    .wk-stat-label {
      font-family: var(--wk-font-mono); font-size: 11px; color: rgba(255,255,255,.5);
      margin-top: 8px; letter-spacing: 0.15em; text-transform: uppercase;
    }

    .wk-values { padding: 100px 80px; background: var(--wk-bg); will-change: transform; }
    .wk-section-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.25em;
      color: var(--wk-amber); text-transform: uppercase; margin-bottom: 16px; text-align: center;
    }
    .wk-section-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(28px, 3.5vw, 42px); letter-spacing: -0.02em; text-transform: uppercase;
      color: var(--wk-ink); text-align: center; margin-bottom: 64px; line-height: 1.05;
    }
    .wk-values-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
    .wk-value {
      padding: 32px; background: var(--wk-elevated);
      border: 0.5px solid rgba(200,118,42,0.2); border-radius: 10px;
      transition: transform .2s, box-shadow .2s;
    }
    .wk-value:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,.08); }
    .wk-value-icon { width: 48px; height: 48px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
    .wk-value-title {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 18px;
      letter-spacing: -0.01em; text-transform: uppercase; color: var(--wk-ink); margin-bottom: 12px;
    }
    .wk-value-body { font-family: var(--wk-font-body); font-size: 16px; color: var(--wk-ink-soft); line-height: 1.7; }

    .wk-quote-section {
      padding: 100px 80px; background: var(--wk-bg2);
      display: flex; justify-content: center; will-change: transform;
    }
    .wk-quote { max-width: 740px; text-align: center; }
    .wk-quote-mark {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 80px;
      color: var(--wk-amber); line-height: .5; display: block; margin-bottom: 16px;
    }
    .wk-quote-text {
      font-family: var(--wk-font-display); font-size: clamp(22px, 3vw, 32px);
      font-weight: 400; color: var(--wk-ink); line-height: 1.5; margin-bottom: 28px;
    }
    .wk-quote-attr {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.15em;
      color: var(--wk-ink-muted); text-transform: uppercase;
    }

    .wk-cta {
      padding: 100px 80px; background: var(--wk-navy);
      display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
    }
    .wk-cta-title {
      font-family: var(--wk-font-display); font-weight: 900;
      font-size: clamp(32px, 4vw, 52px); letter-spacing: -0.03em;
      text-transform: uppercase; color: var(--wk-parchment); line-height: 1.0; margin-bottom: 24px;
    }
    .wk-cta-body { font-family: var(--wk-font-body); font-size: 16px; color: rgba(243,231,204,.6); line-height: 1.7; margin-bottom: 36px; }
    .wk-btn-light {
      font-family: var(--wk-font-display); font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; text-transform: uppercase;
      background: var(--wk-parchment); color: var(--wk-ink);
      padding: 14px 28px; border-radius: 6px; border: none; cursor: pointer;
      min-height: 48px; display: inline-flex; align-items: center; transition: background .2s;
    }
    .wk-btn-light:hover { background: white; }
    .wk-cta-right { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .wk-cta-qr { background: white; border-radius: 12px; padding: 24px; text-align: center; }

    .wk-footer {
      background: var(--wk-navy); border-top: 1px solid rgba(255,255,255,.08);
      padding: 32px 80px; display: flex; align-items: center; justify-content: space-between;
    }
    .wk-footer-brand {
      font-family: var(--wk-font-display); font-weight: 900; font-size: 16px;
      letter-spacing: -0.01em; text-transform: uppercase; color: rgba(243,231,204,.35);
    }
    .wk-footer-brand span { color: var(--wk-amber); }
    .wk-footer-tagline {
      font-family: var(--wk-font-mono); font-size: 10px;
      letter-spacing: 0.2em; color: rgba(255,255,255,.25); text-transform: uppercase;
    }

    /* ── QR FULLSCREEN ── */
    .wk-qr-screen {
      position: fixed; inset: 0; z-index: 500; background: var(--wk-bg);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      animation: wk-fadein .4s ease forwards;
    }
    .wk-qr-back {
      position: fixed; top: 28px; left: 36px;
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--wk-ink-muted);
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; gap: 8px; transition: color .2s;
    }
    .wk-qr-back:hover { color: var(--wk-amber); }
    .wk-qr-eyebrow {
      font-family: var(--wk-font-mono); font-size: 11px; letter-spacing: 0.28em;
      text-transform: uppercase; color: var(--wk-amber); margin-bottom: 40px;
    }
    .wk-qr-card {
      background: var(--wk-elevated); border-radius: 28px; padding: 52px 56px; text-align: center;
      box-shadow: 0 40px 120px rgba(0,0,0,.10), 0 0 0 1px rgba(200,118,42,0.10);
    }
    .wk-qr-url {
      display: block; font-family: var(--wk-font-mono); font-size: 15px;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--wk-amber); margin-top: 36px; text-decoration: none;
    }
    .wk-qr-hint {
      font-family: var(--wk-font-mono); font-size: 10px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--wk-ink-muted); margin-top: 14px;
    }
  `;
  document.head.appendChild(style);
}

// ── LENIS ─────────────────────────────────────────────────────────────────────
let _lenis = null;
function initLenis() {
  if (typeof window === 'undefined' || _lenis) return;
  if (window.__wkLenisReady) { _startLenis(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  s.onload = () => { window.__wkLenisReady = true; _startLenis(); };
  document.head.appendChild(s);
}
function _startLenis() {
  try {
    _lenis = new window.Lenis({ duration: 1.3, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    (function raf(t) { _lenis.raf(t); requestAnimationFrame(raf); })(0);
  } catch(e) {}
}
function destroyLenis() {
  if (_lenis) { try { _lenis.destroy(); } catch(e) {} _lenis = null; }
}

// ── REAL QR CODE ──────────────────────────────────────────────────────────────
function WKQRCode({ size = 180 }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let dead = false;
    import('qrcode').then(mod => {
      if (dead || !ref.current) return;
      const QR = mod.default || mod;
      QR.toCanvas(ref.current, 'https://wanderkind.love', {
        width: size, margin: 2,
        color: { dark: '#1A120A', light: '#FAFAF5' },
        errorCorrectionLevel: 'H',
      }, err => {
        if (err || dead || !ref.current) return;
        const ctx = ref.current.getContext('2d');
        const cell = size / 29;
        // Amber finder patterns over the three corners
        [[2*cell,2*cell],[size-9*cell,2*cell],[2*cell,size-9*cell]].forEach(([fx,fy]) => {
          const fp = 7*cell;
          // wipe
          ctx.fillStyle='#FAFAF5'; ctx.fillRect(fx,fy,fp,fp);
          // outer dark rounded square
          ctx.fillStyle='#1A120A'; rr(ctx,fx,fy,fp,fp,3); ctx.fill();
          // inner light
          ctx.fillStyle='#FAFAF5'; rr(ctx,fx+cell,fy+cell,fp-2*cell,fp-2*cell,2); ctx.fill();
          // amber centre
          ctx.fillStyle='#C8762A'; rr(ctx,fx+2*cell,fy+2*cell,3*cell,3*cell,2); ctx.fill();
        });
        // W logo in centre
        const lw=size*.16, lx=(size-lw)/2, ly=(size-lw)/2;
        ctx.fillStyle='#FAFAF5'; rr(ctx,lx-4,ly-4,lw+8,lw+8,3); ctx.fill();
        ctx.strokeStyle='#C8762A'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath();
        ctx.moveTo(lx+lw*.05,ly+lw*.2); ctx.lineTo(lx+lw*.25,ly+lw*.82);
        ctx.lineTo(lx+lw*.5,ly+lw*.48); ctx.lineTo(lx+lw*.75,ly+lw*.82);
        ctx.lineTo(lx+lw*.95,ly+lw*.2); ctx.stroke();
        setReady(true);
      });
    }).catch(()=>{});
    return () => { dead = true; };
  }, [size]);
  return <canvas ref={ref} width={size} height={size} style={{width:size,height:size,borderRadius:8,display:'block',opacity:ready?1:0,transition:'opacity .3s'}} />;
}
function rr(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
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

// ── GATE ──────────────────────────────────────────────────────────────────────
function GatePhase({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
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

// ── QR FULLSCREEN ─────────────────────────────────────────────────────────────
function QRScreen({ onBack }) {
  return (
    <div className="wk-qr-screen">
      <button className="wk-qr-back" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>
      <div className="wk-qr-eyebrow">&mdash; Open on your phone &mdash;</div>
      <div className="wk-qr-card">
        <WKQRCode size={320}/>
        <a className="wk-qr-url" href="https://wanderkind.love" target="_blank">WWW.WANDERKIND.LOVE</a>
        <div className="wk-qr-hint">Point your camera &middot; No app required</div>
      </div>
    </div>
  );
}

// ── LANDING ───────────────────────────────────────────────────────────────────
function LandingPage({ onQR }) {
  const statsRef  = useRef(null);
  const valuesRef = useRef(null);
  const quoteRef  = useRef(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (statsRef.current)  statsRef.current.style.transform  = `translateY(${y * 0.035}px)`;
        if (valuesRef.current) valuesRef.current.style.transform = `translateY(${y * -0.018}px)`;
        if (quoteRef.current)  quoteRef.current.style.transform  = `translateY(${y * 0.012}px)`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="wk-landing">
      <nav className="wk-nav">
        <a className="wk-nav-logo" href="#">WANDER<span>KIND</span></a>
        <div className="wk-nav-links">
          <a className="wk-nav-link" href="#values">The Way</a>
          <a className="wk-nav-link" href="#community">Community</a>
          <a className="wk-nav-link" href="#join">Join</a>
          <button className="wk-nav-cta" onClick={onQR}>Open on Mobile</button>
        </div>
      </nav>

      <section className="wk-hero">
        <div>
          <div className="wk-hero-eyebrow">&mdash; Free &middot; Community &middot; Open</div>
          <h1 className="wk-hero-title">Walk further.<br/><span>Stay together.</span></h1>
          <p className="wk-hero-body">
            WANDERKIND is the community app for long-distance walkers and travellers.
            Find a bed in a stranger's home tonight. Share your route.
            Move through the world on your own terms.
          </p>
          <div className="wk-hero-actions">
            <button className="wk-btn-primary" onClick={onQR}>Scan to open on mobile</button>
            <button className="wk-btn-secondary" onClick={() => document.getElementById('values')?.scrollIntoView({behavior:'smooth'})}>How it works &rarr;</button>
          </div>
        </div>
        <div className="wk-hero-right" id="join">
          <div className="wk-qr-box">
            <WKQRCode size={180}/>
            <div className="wk-qr-label">Scan to open WANDERKIND</div>
            <div className="wk-qr-sub">wanderkind.love</div>
          </div>
          <div className="wk-phone-hint">Point your phone camera at the code above</div>
        </div>
      </section>

      <div className="wk-stats" ref={statsRef}>
        <div className="wk-stat"><div className="wk-stat-num">26+</div><div className="wk-stat-label">Routes mapped</div></div>
        <div className="wk-stat"><div className="wk-stat-num">Free</div><div className="wk-stat-label">Always &amp; forever</div></div>
        <div className="wk-stat"><div className="wk-stat-num">&infin;</div><div className="wk-stat-label">Kilometres walked</div></div>
        <div className="wk-stat"><div className="wk-stat-num">1</div><div className="wk-stat-label">Rule: walk</div></div>
      </div>

      <section className="wk-values" id="values" ref={valuesRef}>
        <div className="wk-section-eyebrow">&mdash; The WANDERKIND Way</div>
        <h2 className="wk-section-title">Built for everyone<br/>who moves with intention.</h2>
        <div className="wk-values-grid">
          <div className="wk-value">
            <div className="wk-value-icon"><IconDoor/></div>
            <div className="wk-value-title">Open Doors</div>
            <p className="wk-value-body">Community hosts open their homes to fellow Wanderkinder. No payment, no middleman. A bed, a meal, a conversation. The oldest form of hospitality — made findable.</p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon"><IconCompass/></div>
            <div className="wk-value-title">The Route First</div>
            <p className="wk-value-body">Every feature is designed around the journey, not the screen. Maps that work offline at 2000m. Stage planning that understands the logic of long-distance travel.</p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon"><IconPath/></div>
            <div className="wk-value-title">Walk Your Own Way</div>
            <p className="wk-value-body">No algorithm. No ads. No data sold. Your route, your memories, your community — entirely yours. Privacy by default. Simplicity by design.</p>
          </div>
        </div>
      </section>

      <section className="wk-quote-section" id="community" ref={quoteRef}>
        <div className="wk-quote">
          <span className="wk-quote-mark">&ldquo;</span>
          <p className="wk-quote-text">Nothing can go wrong when you put the right foot in front of the other.</p>
          <div className="wk-quote-attr">YEHOSUA HIMSELF &middot; WANDERKIND FOUNDER</div>
        </div>
      </section>

      <section className="wk-cta">
        <div>
          <h2 className="wk-cta-title">Your next stage<br/>starts here.</h2>
          <p className="wk-cta-body">Open on your phone. Find a host for tonight. Walk tomorrow. This is the whole app. Nothing more is needed.</p>
          <button className="wk-btn-light" onClick={onQR}>Open WANDERKIND &rarr;</button>
        </div>
        <div className="wk-cta-right">
          <div className="wk-cta-qr">
            <WKQRCode size={140}/>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#9A8B73',marginTop:14,letterSpacing:'.15em',textTransform:'uppercase'}}>wanderkind.love</div>
          </div>
          <div style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(255,255,255,.3)',textAlign:'center',letterSpacing:'.15em',textTransform:'uppercase'}}>Point your camera to open</div>
        </div>
      </section>

      <footer className="wk-footer">
        <div className="wk-footer-brand">WANDER<span>KIND</span></div>
        <div className="wk-footer-tagline">Wander &middot; Connect &middot; Rest</div>
        <div className="wk-footer-tagline">&copy; 2026 WANDERKIND</div>
      </footer>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export function DesktopGate({ children }) {
  const [phase, setPhase] = useState('gate');
  const [, setTick] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    injectStyles();
    const h = () => setTick(n => n + 1);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (phase === 'landing') initLenis();
    else destroyLenis();
  }, [phase]);

  if (!isDesktop) return <>{children}</>;

  return (
    <>
      {phase === 'gate'    && <GatePhase onDone={() => setPhase('landing')}/>}
      {phase === 'landing' && <LandingPage onQR={() => setPhase('qr')}/>}
      {phase === 'qr'      && <QRScreen onBack={() => setPhase('landing')}/>}
    </>
  );
}
