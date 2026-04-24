/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Core palette
        bg: { DEFAULT: '#FAFAF5', dark: '#0B0705' },
        surface: { DEFAULT: '#FFFFFF', alt: '#F5F0E8', dark: '#140D08' },
        parchment: { DEFAULT: '#F3E7CC', ink: '#1A120A', soft: '#6B5A3E' },
        ink: { DEFAULT: '#1A120A', 2: '#6B5D4F', 3: '#9B8E7E' },
        amber: { DEFAULT: '#C8762A', hi: '#E09A52', bg: 'rgba(200,118,42,0.08)' },
        gold: { DEFAULT: '#D4A017', bg: 'rgba(212,160,23,0.1)' },
        wk: {
          green: '#27864A',
          blue: '#2E6DA4',
          red: '#C0392B',
          tramp: '#E8740A',
        },
        pass: {
          food: '#27864A',
          hosp: '#8B1A2B',
          water: '#4CA8C9',
        },
        border: { DEFAULT: '#E8DFD0', lt: '#F0EBE2' },
        donativo: { DEFAULT: '#D4A017', bg: 'rgba(212,160,23,0.1)', border: 'rgba(212,160,23,0.25)' },
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
        'h1': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'h2': ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '800' }],
        'h3': ['18px', { lineHeight: '1.3', fontWeight: '700' }],
        'body': ['15px', { lineHeight: '1.6' }],
        'body-sm': ['13px', { lineHeight: '1.5' }],
        'caption': ['11px', { lineHeight: '1.4' }],
        'mono-xs': ['10px', { lineHeight: '1.3', letterSpacing: '0.12em' }],
        'mono-2xs': ['9px', { lineHeight: '1.3', letterSpacing: '0.15em' }],
        'label': ['10px', { lineHeight: '1.2', letterSpacing: '0.3em' }],
      },
      borderRadius: {
        'card': '12px',
        'button': '24px',
        'phone': '38px',
      },
      spacing: {
        'safe-top': '54px',
        'nav-height': '54px',
        'screen-px': '20px',
      },
    },
  },
  plugins: [],
};
