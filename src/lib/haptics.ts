/**
 * Haptic feedback utility — works on both native (expo-haptics) and web (Vibration API).
 *
 * Usage:
 *   import { haptic } from '../lib/haptics';
 *   haptic.light();    // Light tap — tab switches, chip selects, toggles
 *   haptic.medium();   // Medium impact — pull-to-refresh, card press, stamp creation
 *   haptic.heavy();    // Heavy impact — important actions (Start Way, Send Message)
 *   haptic.success();  // Success pattern — stamp scanned, message sent, profile saved
 *   haptic.warning();  // Warning pattern — delete confirmation, error
 *   haptic.selection(); // Selection change — filter chips, picker changes
 */

import { Platform } from 'react-native';

// Web vibration patterns (ms)
const WEB_PATTERNS = {
  light: [10],
  medium: [25],
  heavy: [40],
  success: [15, 50, 25],
  warning: [30, 30, 30],
  selection: [8],
};

function vibrateWeb(pattern: number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch { /* vibration not supported */ }
}

async function nativeImpact(style: 'Light' | 'Medium' | 'Heavy') {
  try {
    const Haptics = require('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
  } catch { /* expo-haptics not available */ }
}

async function nativeNotification(type: 'Success' | 'Warning' | 'Error') {
  try {
    const Haptics = require('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
  } catch { /* expo-haptics not available */ }
}

async function nativeSelection() {
  try {
    const Haptics = require('expo-haptics');
    await Haptics.selectionAsync();
  } catch { /* expo-haptics not available */ }
}

export const haptic = {
  /** Light tap — tab switches, chip selects, toggles */
  light: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.light);
    else nativeImpact('Light');
  },

  /** Medium impact — pull-to-refresh, card press, stamp actions */
  medium: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.medium);
    else nativeImpact('Medium');
  },

  /** Heavy impact — important CTAs (Start Way, Send Message, Emergency) */
  heavy: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.heavy);
    else nativeImpact('Heavy');
  },

  /** Success pattern — stamp scanned, message sent, profile saved */
  success: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.success);
    else nativeNotification('Success');
  },

  /** Warning pattern — delete confirm, error state */
  warning: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.warning);
    else nativeNotification('Warning');
  },

  /** Selection change — filter chips, picker scroll, tab switch */
  selection: () => {
    if (Platform.OS === 'web') vibrateWeb(WEB_PATTERNS.selection);
    else nativeSelection();
  },
};
