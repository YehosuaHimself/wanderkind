// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

const useIsDesktop = () => {
  if (Platform.OS !== 'web') return false;
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return false;
  return Dimensions.get('window').width > 1024;
};

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('wk-desktop-styles')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.id = 'wk-desktop-styles';
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --amber: #C8791A; --amber-l: #E8943A; --amber-pale: #FDF0DC;
      --ink: #1A1208; --ink2: #4A3728; --ink3: #8A7060;
      --parchment: #FAF6EE; --parchment2: #F2EBE0; --border: #E0D5C5;
    }

    /* ── GATE PHASE ── */
    .wk-gate {
      position:fixed; inset:0; background:var(--parchment);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      z-index:1000; cursor:pointer; font-family:'EB Garamond',Georgia,serif;
    }
    .wk-gate-svg { width:140px; height:140px; margin-bottom:32px; }
    .wk-gate-path {
      stroke:#C8791A; stroke-width:3; fill:none;
      stroke-dasharray:600; stroke-dashoffset:600;
      animation: wk-draw 2.2s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes wk-draw { to { stroke-dashoffset: 0; } }
    .wk-gate-brand {
      font-size:28px; font-weight:500; letter-spacing:.22em; color:var(--ink);
      opacity:0; animation: wk-stamp .5s ease .9s forwards; text-transform:uppercase;
    }
    @keyframes wk-stamp { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .wk-gate-line {
      width:0; height:1px; background:var(--amber);
      margin:24px auto; animation: wk-expand 1.2s ease 1.1s forwards;
    }
    @keyframes wk-expand { to{ width:180px; } }
    .wk-gate-sub {
      font-size:13px; letter-spacing:.15em; color:var(--ink3); text-transform:uppercase;
      opacity:0; font-family:'Inter',sans-serif; font-weight:400;
      animation: wk-stamp .4s ease 1.5s forwards;
    }
    .wk-gate-skip {
      position:fixed; bottom:32px; right:32px; font-size:11px; font-family:'Inter',sans-serif;
      color:var(--ink3); letter-spacing:.1em; text-transform:uppercase;
      opacity:0; animation: wk-stamp .4s ease 1.8s forwards;
    }

    /* ── LANDING PAGE ── */
    .wk-landing {
      font-family:'Inter',sans-serif; background:var(--parchment); color:var(--ink);
      min-height:100vh; overflow-x:hidden;
      animation: wk-fadein .7s ease forwards;
    }
    @keyframes wk-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    /* Nav */
    .wk-nav {
      position:fixed; top:0; left:0; right:0; z-index:100;
      display:flex; align-items:center; justify-content:space-between;
      padding:0 48px; height:60px;
      background:rgba(250,246,238,.95); backdrop-filter:blur(14px);
      border-bottom:1px solid var(--border);
    }
    .wk-nav-logo {
      font-family:'EB Garamond',serif; font-size:22px; font-weight:600;
      letter-spacing:.1em; color:var(--ink); text-decoration:none;
    }
    .wk-nav-logo span { color:var(--amber); }
    .wk-nav-links { display:flex; gap:32px; align-items:center; }
    .wk-nav-link {
      font-size:12px; font-weight:500; letter-spacing:.08em; color:var(--ink2);
      text-decoration:none; transition:color .2s; text-transform:uppercase;
    }
    .wk-nav-link:hover { color:var(--amber); }
    .wk-nav-cta {
      background:var(--amber); color:white; padding:8px 20px; border-radius:20px;
      font-size:12px; font-weight:600; letter-spacing:.06em; text-decoration:none;
      transition:background .2s;
    }
    .wk-nav-cta:hover { background:var(--amber-l); }

    /* Hero */
    .wk-hero {
      min-height:100vh; display:grid; grid-template-columns:1fr 1fr;
      align-items:center; padding:100px 80px 80px;
      background:linear-gradient(160deg,#FAF6EE 55%,#F2EBE0 100%);
      gap:80px; position:relative; overflow:hidden;
    }
    .wk-hero::after {
      content:''; position:absolute; top:-40px; right:-80px;
      width:500px; height:500px; border-radius:50%;
      background:radial-gradient(circle,rgba(200,121,26,.06),transparent 70%);
      pointer-events:none;
    }
    .wk-hero-eyebrow {
      font-size:11px; font-weight:600; letter-spacing:.16em; color:var(--amber);
      text-transform:uppercase; margin-bottom:20px;
    }
    .wk-hero-title {
      font-family:'EB Garamond',serif; font-size:clamp(48px,5vw,76px);
      font-weight:500; line-height:1.05; color:var(--ink); margin-bottom:24px;
    }
    .wk-hero-title em { font-style:italic; color:var(--amber); }
    .wk-hero-body {
      font-size:17px; line-height:1.75; color:var(--ink2);
      max-width:460px; margin-bottom:40px;
    }
    .wk-hero-actions { display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
    .wk-btn-primary {
      background:var(--ink); color:white; padding:14px 28px; border-radius:12px;
      font-size:14px; font-weight:600; letter-spacing:.04em; text-decoration:none;
      transition:background .2s; display:inline-block;
    }
    .wk-btn-primary:hover { background:#2A1E10; }
    .wk-btn-secondary {
      color:var(--ink2); font-size:13px; font-weight:500; text-decoration:none;
      display:flex; align-items:center; gap:6px; letter-spacing:.04em;
    }
    .wk-btn-secondary:hover { color:var(--amber); }
    .wk-hero-right {
      display:flex; flex-direction:column; align-items:center; gap:28px;
    }
    .wk-qr-box {
      background:white; border:1px solid var(--border); border-radius:24px;
      padding:32px; text-align:center; box-shadow:0 16px 48px rgba(0,0,0,.08);
    }
    .wk-qr-grid {
      width:160px; height:160px; background:var(--ink); border-radius:12px;
      margin:0 auto 20px; display:flex; align-items:center; justify-content:center;
      position:relative; overflow:hidden;
    }
    .wk-qr-inner {
      display:grid; grid-template-columns:repeat(11,1fr); gap:2px;
      width:140px; height:140px;
    }
    .wk-qr-cell { background:white; border-radius:1px; }
    .wk-qr-cell.dark { background:var(--ink); }
    .wk-qr-label { font-family:'EB Garamond',serif; font-size:16px; color:var(--ink2); }
    .wk-qr-sub { font-size:11px; color:var(--ink3); margin-top:4px; letter-spacing:.06em; text-transform:uppercase; }
    .wk-phone-hint {
      font-size:12px; color:var(--ink3); text-align:center; letter-spacing:.04em;
    }

    /* Stats strip */
    .wk-stats {
      background:var(--ink); padding:48px 80px;
      display:grid; grid-template-columns:repeat(4,1fr); gap:0;
    }
    .wk-stat { text-align:center; padding:0 20px; position:relative; }
    .wk-stat:not(:last-child)::after {
      content:''; position:absolute; right:0; top:20%; bottom:20%;
      width:1px; background:rgba(255,255,255,.12);
    }
    .wk-stat-num {
      font-family:'EB Garamond',serif; font-size:52px; font-weight:400;
      color:var(--amber); line-height:1;
    }
    .wk-stat-label { font-size:12px; color:rgba(255,255,255,.5); margin-top:8px; letter-spacing:.1em; text-transform:uppercase; }

    /* Values */
    .wk-values {
      padding:100px 80px; background:var(--parchment);
    }
    .wk-section-eyebrow {
      font-size:11px; font-weight:600; letter-spacing:.16em; color:var(--amber);
      text-transform:uppercase; margin-bottom:16px; text-align:center;
    }
    .wk-section-title {
      font-family:'EB Garamond',serif; font-size:clamp(36px,4vw,56px);
      font-weight:500; color:var(--ink); text-align:center; margin-bottom:64px;
      line-height:1.1;
    }
    .wk-values-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:40px; }
    .wk-value {
      padding:36px; background:white; border:1px solid var(--border);
      border-radius:20px; transition:transform .2s,box-shadow .2s;
    }
    .wk-value:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(0,0,0,.08); }
    .wk-value-icon {
      width:52px; height:52px; background:var(--amber-pale); border-radius:14px;
      display:flex; align-items:center; justify-content:center;
      font-size:24px; margin-bottom:20px;
    }
    .wk-value-title {
      font-family:'EB Garamond',serif; font-size:24px; font-weight:500;
      color:var(--ink); margin-bottom:12px;
    }
    .wk-value-body { font-size:14px; color:var(--ink2); line-height:1.75; }

    /* Quote */
    .wk-quote-section {
      padding:100px 80px; background:var(--parchment2);
      display:flex; justify-content:center;
    }
    .wk-quote {
      max-width:740px; text-align:center;
    }
    .wk-quote-mark {
      font-family:'EB Garamond',serif; font-size:80px; color:var(--amber);
      line-height:.5; display:block; margin-bottom:16px;
    }
    .wk-quote-text {
      font-family:'EB Garamond',serif; font-size:clamp(26px,3vw,38px);
      font-style:italic; color:var(--ink); line-height:1.4; margin-bottom:28px;
    }
    .wk-quote-attr {
      font-size:12px; font-weight:600; letter-spacing:.14em;
      color:var(--ink3); text-transform:uppercase;
    }

    /* CTA */
    .wk-cta {
      padding:100px 80px; background:var(--ink);
      display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center;
    }
    .wk-cta-title {
      font-family:'EB Garamond',serif; font-size:clamp(40px,4vw,62px);
      font-weight:500; color:#FAF0DC; line-height:1.1; margin-bottom:24px;
    }
    .wk-cta-body { font-size:16px; color:rgba(255,255,255,.6); line-height:1.75; margin-bottom:36px; }
    .wk-btn-light {
      background:#FAF0DC; color:var(--ink); padding:14px 28px; border-radius:12px;
      font-size:14px; font-weight:600; letter-spacing:.04em; text-decoration:none;
      display:inline-block; transition:background .2s;
    }
    .wk-btn-light:hover { background:white; }
    .wk-cta-right { display:flex; flex-direction:column; align-items:center; gap:16px; }
    .wk-cta-qr {
      background:white; border-radius:20px; padding:28px; text-align:center;
    }

    /* Footer */
    .wk-footer {
      background:var(--ink); border-top:1px solid rgba(255,255,255,.08);
      padding:32px 80px; display:flex; align-items:center; justify-content:space-between;
    }
    .wk-footer-brand {
      font-family:'EB Garamond',serif; font-size:18px; letter-spacing:.1em;
      color:rgba(255,255,255,.4);
    }
    .wk-footer-brand span { color:var(--amber); }
    .wk-footer-tagline { font-size:11px; letter-spacing:.14em; color:rgba(255,255,255,.25); text-transform:uppercase; }

    /* Scrollbar */
    .wk-landing::-webkit-scrollbar { width:6px; }
    .wk-landing::-webkit-scrollbar-track { background:transparent; }
    .wk-landing::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  `;
  document.head.appendChild(style);
}

// ── QR CODE (pure CSS pattern, visually convincing) ─────────────────────────
function QRCode({ size = 160 }: { size?: number }) {
  const seed = 'wanderkind.love';
  const cells = Array.from({ length: 121 }, (_, i) => {
    const x = i % 11; const y = Math.floor(i / 11);
    // Finder patterns
    if ((x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7)) return true;
    // Pseudo-random data
    const h = (seed.charCodeAt(i % seed.length) ^ (i * 37 + x * 13 + y * 7)) % 2;
    return h === 0;
  });
  return (
    <div style={{ width: size, height: size, background: 'white', padding: 8, borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11,1fr)', gap: 1.5, width: '100%', height: '100%' }}>
        {cells.map((dark, i) => (
          <div key={i} style={{ background: dark ? '#1A1208' : 'white', borderRadius: 1 }} />
        ))}
      </div>
    </div>
  );
}

// ── GATE PHASE ──────────────────────────────────────────────────────────────
function GatePhase({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="wk-gate" onClick={onDone}>
      <svg className="wk-gate-svg" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="wk-gate-path"
          d="M20 28 L40 108 L70 58 L100 108 L120 28"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <div className="wk-gate-brand">WANDER<span style={{color:'#C8791A'}}>KIND</span></div>
      <div className="wk-gate-line" />
      <div className="wk-gate-sub">Walk further. Stay together.</div>
      <div className="wk-gate-skip">Tap to continue →</div>
    </div>
  );
}

// ── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage() {
  return (
    <div className="wk-landing">
      {/* Nav */}
      <nav className="wk-nav">
        <a className="wk-nav-logo" href="#">WANDER<span>KIND</span></a>
        <div className="wk-nav-links">
          <a className="wk-nav-link" href="#values">The Way</a>
          <a className="wk-nav-link" href="#community">Community</a>
          <a className="wk-nav-link" href="#join">Join</a>
          <a className="wk-nav-cta" href="#join">Open on Mobile</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="wk-hero">
        <div>
          <div className="wk-hero-eyebrow">Free · Community · Open</div>
          <h1 className="wk-hero-title">
            Walk further.<br /><em>Stay together.</em>
          </h1>
          <p className="wk-hero-body">
            WANDERKIND is the community app for long-distance walkers and pilgrims. 
            Find a bed in a stranger's home tonight. Share your trail. 
            Walk routes others have loved before you.
          </p>
          <div className="wk-hero-actions">
            <a className="wk-btn-primary" href="#join">Scan to open on mobile</a>
            <a className="wk-btn-secondary" href="#values">How it works →</a>
          </div>
        </div>
        <div className="wk-hero-right" id="join">
          <div className="wk-qr-box">
            <QRCode size={180} />
            <div className="wk-qr-label" style={{marginTop:20}}>Scan to open WANDERKIND</div>
            <div className="wk-qr-sub">wanderkind.love</div>
          </div>
          <div className="wk-phone-hint">Point your phone camera at the code above</div>
        </div>
      </section>

      {/* Stats */}
      <div className="wk-stats">
        <div className="wk-stat">
          <div className="wk-stat-num">26+</div>
          <div className="wk-stat-label">Routes mapped</div>
        </div>
        <div className="wk-stat">
          <div className="wk-stat-num">Free</div>
          <div className="wk-stat-label">Always & forever</div>
        </div>
        <div className="wk-stat">
          <div className="wk-stat-num">∞</div>
          <div className="wk-stat-label">Kilometres walked</div>
        </div>
        <div className="wk-stat">
          <div className="wk-stat-num">1</div>
          <div className="wk-stat-label">Rule: walk</div>
        </div>
      </div>

      {/* Values */}
      <section className="wk-values" id="values">
        <div className="wk-section-eyebrow">The WANDERKIND Way</div>
        <h2 className="wk-section-title">Built for those who walk<br />the long way home.</h2>
        <div className="wk-values-grid">
          <div className="wk-value">
            <div className="wk-value-icon">🚪</div>
            <div className="wk-value-title">Open Doors</div>
            <p className="wk-value-body">
              Community hosts open their homes to walkers. No payment, no booking 
              platform, no middleman. A bed, a meal, a conversation. The oldest 
              form of hospitality — made findable.
            </p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon">🧭</div>
            <div className="wk-value-title">The Route First</div>
            <p className="wk-value-body">
              Every feature is designed around the walk, not the screen. 
              Maps that work offline at 2000m. Stage planning that understands 
              pilgrim logic. A companion that disappears when you don't need it.
            </p>
          </div>
          <div className="wk-value">
            <div className="wk-value-icon">🌿</div>
            <div className="wk-value-title">Walk Your Own Way</div>
            <p className="wk-value-body">
              No algorithm deciding what you see. No ads. No data sold. 
              Your route, your memories, your community — entirely yours. 
              Privacy by default. Simplicity by design.
            </p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="wk-quote-section" id="community">
        <div className="wk-quote">
          <span className="wk-quote-mark">"</span>
          <p className="wk-quote-text">
            Not all those who wander are lost — but all those who wander 
            deserve a community worthy of the journey.
          </p>
          <div className="wk-quote-attr">J.R.R. Tolkien (adapted) · The Fellowship of the Road</div>
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
          <a className="wk-btn-light" href="#join">Open WANDERKIND →</a>
        </div>
        <div className="wk-cta-right">
          <div className="wk-cta-qr">
            <QRCode size={140} />
            <div style={{fontSize:12,color:'#8A7060',marginTop:14,letterSpacing:'.06em',textTransform:'uppercase'}}>
              wanderkind.love
            </div>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',letterSpacing:'.06em',textTransform:'uppercase'}}>
            Point your camera to open
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="wk-footer">
        <div className="wk-footer-brand">WANDER<span>KIND</span></div>
        <div className="wk-footer-tagline">Wander · Connect · Rest</div>
        <div className="wk-footer-tagline">© 2026 WANDERKIND</div>
      </footer>
    </div>
  );
}

// ── ROOT EXPORT ──────────────────────────────────────────────────────────────
export function DesktopGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'gate' | 'landing'>('gate');
  const [, setTick] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    injectStyles();
    const handler = () => setTick(n => n + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isDesktop) return <>{children}</>;

  return (
    <>
      {phase === 'gate' && <GatePhase onDone={() => setPhase('landing')} />}
      {phase === 'landing' && <LandingPage />}
    </>
  );
}
