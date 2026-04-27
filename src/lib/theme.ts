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

  // Ink — per Design Guidelines V3 §04
  ink: '#1A120A',
  ink2: '#6B5A3E',    // ink-soft per guidelines
  ink3: '#9A8B73',    // ink-muted per guidelines

  // Brand
  amber: '#C8762A',
  amberHi: '#E09A52',
  amberBg: 'rgba(200,118,42,0.08)',
  amberLine: 'rgba(200,118,42,0.15)',

  // Semantic
  gold: '#D4A017',
  goldBg: 'rgba(212,160,23,0.1)',
  goldBorder: 'rgba(212,160,23,0.25)',
  green: '#5A7A2B',    // success per guidelines V3 §04
  greenBg: 'rgba(90,122,43,0.08)',
  blue: '#2E6DA4',
  blueBg: 'rgba(46,109,164,0.08)',
  red: '#B03A3A',     // error per guidelines V3 §04
  redBg: 'rgba(176,58,58,0.06)',
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
  md: 16,     // 8-point grid per guidelines V3 §06
  lg: 24,     // 8-point grid
  xl: 32,     // 8-point grid
  '2xl': 48,  // 8-point grid
  '3xl': 64,  // 8-point grid
  '4xl': 96,  // 8-point grid
  screenPx: 24, // page horizontal per guidelines §06 (22px → 24px nearest grid)
  safeTop: 56,  // 8-point grid
  navHeight: 56, // 8-point grid
} as const;

export const typography = {
  // Per Design Guidelines V3 §03 — 1.25× ratio: 11→14→16→18→20→24→32→42
  display: { fontSize: 42, fontWeight: '900' as const, letterSpacing: -0.84, lineHeight: 42 },
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.64, lineHeight: 35 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.48, lineHeight: 29 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 26 },     // 16px minimum per §03
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },   // secondary info per §03
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },  // mono labels per §03
  monoXs: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 1.65, lineHeight: 14 },
  mono2xs: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 1.5, lineHeight: 13 },
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
export const hostTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  // Core pricing tiers
  free:                 { label: 'FREE STAY',        color: '#27864A', bg: 'rgba(39,134,74,0.08)' },
  donativo:             { label: 'DONATIVO',          color: '#D4A017', bg: 'rgba(212,160,23,0.1)' },
  budget:               { label: 'LOW COST',          color: '#2E6DA4', bg: 'rgba(46,109,164,0.08)' },
  paid:                 { label: 'PAID',              color: '#9B8E7E', bg: 'rgba(155,142,126,0.08)' },
  // Albergue subtypes
  albergue_municipal:   { label: 'MUNICIPAL',         color: '#1D6FA4', bg: 'rgba(29,111,164,0.08)' },
  albergue_privado:     { label: 'PRIVATE ALBERGUE',  color: '#C8762A', bg: 'rgba(200,118,42,0.08)' },
  albergue_parroquial:  { label: 'PARISH',            color: '#6B21A8', bg: 'rgba(107,33,168,0.08)' },
  albergue_asociacion:  { label: 'ASSOCIATION',       color: '#0E7490', bg: 'rgba(14,116,144,0.08)' },
  // Religious
  monastery:            { label: 'MONASTERY',         color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  church:               { label: 'CHURCH',            color: '#8B4513', bg: 'rgba(139,69,19,0.08)' },
  // Accommodation types
  gite_etape:           { label: "GÎTE D'ÉTAPE",     color: '#047857', bg: 'rgba(4,120,87,0.08)' },
  refuge:               { label: 'REFUGE',            color: '#374151', bg: 'rgba(55,65,81,0.08)' },
  camping:              { label: 'CAMPING',           color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  pension:              { label: 'PENSION',           color: '#B45309', bg: 'rgba(180,83,9,0.08)' },
  hotel_budget:         { label: 'HOTEL',             color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
  private_host:         { label: 'PRIVATE HOST',      color: '#C8762A', bg: 'rgba(200,118,42,0.06)' },
  tourist_info:         { label: 'TOURIST INFO',      color: '#0284C7', bg: 'rgba(2,132,199,0.08)' },
  community:            { label: 'COMMUNITY',         color: '#9B8E7E', bg: 'rgba(155,142,126,0.08)' },
};

// Trust Layer — freshness badges based on last_confirmed date
export function getFreshnessBadge(lastConfirmed: string | null | undefined): { label: string; color: string; bg: string; icon: string } {
  if (!lastConfirmed) return { label: 'UNVERIFIED', color: '#9B8E7E', bg: 'rgba(155,142,126,0.08)', icon: 'help-circle-outline' };
  const days = Math.floor((Date.now() - new Date(lastConfirmed).getTime()) / 86400000);
  if (days <= 90) return { label: 'FRESH', color: '#27864A', bg: 'rgba(39,134,74,0.08)', icon: 'checkmark-circle' };
  if (days <= 180) return { label: 'RECENT', color: '#2E6DA4', bg: 'rgba(46,109,164,0.08)', icon: 'time-outline' };
  if (days <= 365) return { label: 'AGING', color: '#D4A017', bg: 'rgba(212,160,23,0.1)', icon: 'alert-circle-outline' };
  return { label: 'STALE', color: '#B03A3A', bg: 'rgba(176,58,58,0.06)', icon: 'warning-outline' };
}

// Response time badges based on avg_response_minutes
export function getResponseTimeBadge(avgResponseMinutes: number | null | undefined): { label: string; color: string; bg: string; icon: string } {
  if (!avgResponseMinutes) return { label: 'NEW HOST', color: '#9B8E7E', bg: 'rgba(155,142,126,0.08)', icon: 'time-outline' };
  if (avgResponseMinutes <= 120) return { label: 'REPLIES FAST', color: '#27864A', bg: 'rgba(39,134,74,0.08)', icon: 'flash-outline' };
  if (avgResponseMinutes <= 720) return { label: 'REPLIES SAME DAY', color: '#2E6DA4', bg: 'rgba(46,109,164,0.08)', icon: 'time-outline' };
  return { label: 'REPLIES SLOWLY', color: '#D4A017', bg: 'rgba(212,160,23,0.1)', icon: 'hourglass-outline' };
}

// Data source labels
export const dataSourceConfig: Record<string, { label: string; color: string }> = {
  official_listing: { label: 'OFFICIAL', color: '#27864A' },
  association_directory: { label: 'ASSOCIATION', color: '#2E6DA4' },
  partner_api: { label: 'PARTNER', color: '#D4A017' },
  community_report: { label: 'COMMUNITY', color: '#C8762A' },
  osm_import: { label: 'OSM', color: '#9B8E7E' },
};
