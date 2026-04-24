// WANDERKIND V6.0 — Design Token System
// Matches the production specification exactly.

export const colors = {
  // Core
  bg: '#FAFAF5',
  bgDark: '#0B0705',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0E8',
  surfaceDark: '#140D08',
  parchment: '#F3E7CC',
  parchmentInk: '#1A120A',
  parchmentSoft: '#6B5A3E',

  // Ink
  ink: '#1A120A',
  ink2: '#6B5D4F',
  ink3: '#9B8E7E',

  // Brand
  amber: '#C8762A',
  amberHi: '#E09A52',
  amberBg: 'rgba(200,118,42,0.08)',
  amberLine: 'rgba(200,118,42,0.15)',

  // Semantic
  gold: '#D4A017',
  goldBg: 'rgba(212,160,23,0.1)',
  goldBorder: 'rgba(212,160,23,0.25)',
  green: '#27864A',
  greenBg: 'rgba(39,134,74,0.08)',
  blue: '#2E6DA4',
  blueBg: 'rgba(46,109,164,0.08)',
  red: '#C0392B',
  redBg: 'rgba(192,57,43,0.08)',
  tramp: '#E8740A',
  trampBg: 'rgba(232,116,10,0.08)',

  // Passes
  passFood: '#27864A',
  passHosp: '#8B1A2B',
  passWater: '#4CA8C9',

  // Borders
  border: '#E8DFD0',
  borderLt: '#F0EBE2',
  borderDark: 'rgba(200,118,42,0.15)',

  // Map markers
  markerFree: '#D4A017',
  markerDonativo: '#C8762A',
  markerBudget: '#2E6DA4',
  markerPaid: '#9B8E7E',

  // Verification badge colors
  verSelf: '#9B8E7E',
  verCommunity: '#C8762A',
  verAssociation: '#D4A017',
  verWanderkind: '#27864A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  screenPx: 20,
  safeTop: 54,
  navHeight: 54,
} as const;

export const typography = {
  display: { fontSize: 48, fontWeight: '900' as const, letterSpacing: -1.44, lineHeight: 48 },
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.64, lineHeight: 35 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.24, lineHeight: 29 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 23 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19.5 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 15.4 },
  monoXs: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 1.2, lineHeight: 13 },
  mono2xs: { fontSize: 9, fontWeight: '500' as const, letterSpacing: 1.35, lineHeight: 11.7 },
  label: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 3, lineHeight: 12, textTransform: 'uppercase' as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#1A120A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1A120A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  button: 24,
  phone: 38,
  full: 9999,
} as const;

// Tier badge colors
export const tierColors: Record<string, string> = {
  wanderkind: '#9B8E7E',
  wunderkind: '#9B8E7E',
  wandersmann: '#C8762A',
  ehrenmann: '#C8762A',
  pilger: '#C8762A',
  apostel: '#D4A017',
  lehrer: '#D4A017',
  meister: '#B8860B',
  grossmeister: '#B8860B',
  legende: '#27864A',
  koenig: '#27864A',
};

// Host type label + color
export const hostTypeConfig = {
  free: { label: 'FREE', color: '#27864A', bg: 'rgba(39,134,74,0.08)' },
  donativo: { label: 'DONATIVO', color: '#D4A017', bg: 'rgba(212,160,23,0.1)' },
  budget: { label: 'BUDGET', color: '#2E6DA4', bg: 'rgba(46,109,164,0.08)' },
  paid: { label: 'PAID', color: '#9B8E7E', bg: 'rgba(155,142,126,0.08)' },
} as const;
