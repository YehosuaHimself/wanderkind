/**
 * useBiometricGate — two-tier verification gate.
 *
 * Returns the user's biometric status and a helper to guard any action.
 * Pattern of use:
 *
 *   const { isVerified, require } = useBiometricGate();
 *
 *   // At the action site:
 *   const handleSend = require(() => {
 *     // only executes when biometric_verified === true
 *     sendMessage();
 *   });
 *
 * The `require` wrapper sets gateVisible = true if not verified,
 * which callers should use to conditionally render <BiometricGate />.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../stores/auth';

export interface BiometricGateHook {
  /** True when profile.biometric_verified === true */
  isVerified: boolean;
  /** Show the gate UI (controlled by require()) */
  gateVisible: boolean;
  /** Open the gate manually (e.g. from an info button) */
  openGate: () => void;
  /** Close/dismiss the gate */
  closeGate: () => void;
  /**
   * Wrap an action: if verified, runs it immediately.
   * If not, opens the biometric gate and queues the action
   * to run automatically once verification completes.
   */
  require: <T extends (...args: any[]) => any>(action: T) => (...args: Parameters<T>) => void;
  /** Call this after successful verification to run any queued action */
  onVerified: () => void;
}

export function useBiometricGate(): BiometricGateHook {
  const { profile } = useAuth();
  const [gateVisible, setGateVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Verified if biometric_verified flag is true OR verification_level is 'biometric'
  // (dual-check covers DB backfill period during US-03 rollout)
  const isVerified =
    !!(profile as any)?.biometric_verified ||
    profile?.verification_level === 'biometric';

  const openGate = useCallback(() => setGateVisible(true), []);
  const closeGate = useCallback(() => {
    setGateVisible(false);
    setPendingAction(null);
  }, []);

  const require = useCallback(<T extends (...args: any[]) => any>(action: T) => {
    return (...args: Parameters<T>) => {
      if (isVerified) {
        action(...args);
      } else {
        // Queue the action to fire after verification
        setPendingAction(() => () => action(...args));
        setGateVisible(true);
      }
    };
  }, [isVerified]);

  const onVerified = useCallback(() => {
    setGateVisible(false);
    // Run pending action on next tick (profile state needs to propagate)
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 300);
    }
  }, [pendingAction]);

  return { isVerified, gateVisible, openGate, closeGate, require, onVerified };
}
