/**
 * PS-07: Visual Progression — Passes Evolve with Experience
 *
 * Pass backgrounds subtly change at tier thresholds.
 * Milestone badges appear at 10, 50, 100 nights.
 * Higher verification levels get more ornate visual treatment.
 */

import { VerificationLevel } from '../types/database';

export interface PassProgression {
  /** Subtle background tint overlay (CSS rgba) */
  backgroundTint: string;
  /** Border style — more ornate with experience */
  borderWidth: number;
  borderColor: string;
  /** Milestone badges earned */
  milestones: { icon: string; label: string; color: string }[];
  /** Verification ornament level (0-3) */
  ornamentLevel: number;
  /** Whether to show the golden shimmer effect */
  showShimmer: boolean;
}

/**
 * Compute visual progression based on nights walked and verification level
 */
export function getPassProgression(
  nightsWalked: number,
  verificationLevel: VerificationLevel | string,
): PassProgression {
  const milestones: PassProgression['milestones'] = [];

  // Milestone badges based on nights walked
  if (nightsWalked >= 10) {
    milestones.push({ icon: 'footsteps', label: '10 Nights', color: '#C8762A' });
  }
  if (nightsWalked >= 50) {
    milestones.push({ icon: 'trail-sign', label: '50 Nights', color: '#D4A017' });
  }
  if (nightsWalked >= 100) {
    milestones.push({ icon: 'star', label: '100 Nights', color: '#B8860B' });
  }
  if (nightsWalked >= 365) {
    milestones.push({ icon: 'diamond', label: '1 Year', color: '#8B6914' });
  }

  // Verification ornament level
  const ornamentMap: Record<string, number> = {
    none: 0,
    self: 0,
    community: 1,
    association: 2,
    wanderkind: 3,
  };
  const ornamentLevel = ornamentMap[verificationLevel] ?? 0;

  // Background tint — subtle gold that deepens with experience
  let backgroundTint = 'rgba(212, 160, 23, 0.00)'; // no tint for beginners
  if (nightsWalked >= 10) backgroundTint = 'rgba(212, 160, 23, 0.02)';
  if (nightsWalked >= 50) backgroundTint = 'rgba(212, 160, 23, 0.04)';
  if (nightsWalked >= 100) backgroundTint = 'rgba(212, 160, 23, 0.06)';
  if (nightsWalked >= 365) backgroundTint = 'rgba(184, 134, 11, 0.08)';

  // Border becomes more prominent with verification
  let borderWidth = 1;
  let borderColor = 'rgba(212, 160, 23, 0.15)';
  if (ornamentLevel >= 1) {
    borderWidth = 1.5;
    borderColor = 'rgba(212, 160, 23, 0.25)';
  }
  if (ornamentLevel >= 2) {
    borderWidth = 2;
    borderColor = 'rgba(212, 160, 23, 0.35)';
  }
  if (ornamentLevel >= 3) {
    borderWidth = 2.5;
    borderColor = 'rgba(184, 134, 11, 0.5)';
  }

  // Golden shimmer for experienced walkers
  const showShimmer = nightsWalked >= 100 || ornamentLevel >= 2;

  return {
    backgroundTint,
    borderWidth,
    borderColor,
    milestones,
    ornamentLevel,
    showShimmer,
  };
}

/**
 * Get verification badge text for display on passes
 */
export function getVerificationBadgeText(level: VerificationLevel | string): string {
  const map: Record<string, string> = {
    none: '',
    self: 'SELF-DECLARED',
    community: 'COMMUNITY VERIFIED',
    association: 'ASSOCIATION ENDORSED',
    wanderkind: 'WANDERKIND VERIFIED',
  };
  return map[level] || '';
}
