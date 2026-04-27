// This file is a scratch buffer — actual file is at /tmp/wanderkind-app/src/components/web/WebAuthScreen.tsx
// Writing here so the user can preview if they want.

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { colors, typography, spacing, radii } from '../../lib/theme';

type Mode = 'signin' | 'signup';

interface Props {
  mode: Mode;
  role?: string;
}

/**
 * WebAuthScreen — vanilla HTML signup/signin form rendered through React Portal
 * directly into document.body.
 *
 * WHY THIS EXISTS
 * ===============
 * On iOS Safari, the previous WKInput-based signup screen had a bug where
 * tapping a field showed the focus ring + caret but never brought up the
 * soft keyboard. After three rounds of layered fixes (form wrapping,
 * autoComplete attributes, body overflow, transform stripping, focus-state
 * removal, scroll-into-view) the bug persisted. Diagnosis showed the input
 * was buried under ~12 layers of wrappers including:
 *   - Expo Router's Stack screen wrapper (position: absolute)
 *   - React Native Web's ScrollView wrapper (transform: matrix(...) for HW accel)
 *   - Several flex container divs from RNW's View components
 *
 * iOS Safari has documented bugs around inputs inside transformed and absolute-
 * positioned parents — the soft keyboard activation pathway is unreliable.
 *
 * SOLUTION
 * ========
 * createPortal mounts the form directly into document.body. The inputs live
 * as direct children of body, with no transformed or absolute-positioned
 * ancestors. iOS Safari sees them as "normal" inputs and brings up the
 * keyboard reliably.
 *
 * The component returns the portal output from React's perspective, so React
 * still manages the lifecycle (cleanup on navigation away). Visually the
 * portal covers the screen via position: fixed.
 */
export function WebAuthScreen({ mode, role }: Props) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Become a Wanderkind' : 'Welcome back';
  const subtitle = isSignup
    ? 'Your email and password secure your account.'
    : 'Sign in to continue your journey.';
  const submitLabel = isSignup ? 'Become a Wanderkind' : 'Sign in';

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';

    if (!password) e.password = 'Password is required';
    else if (isSignup) {
      if (password.length < 8) e.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
        e.password = 'Include at least one uppercase letter and one number';
    }

    if (isSignup) {
      if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!birthYear) e.birthYear = 'Birth year is required';
      else {
        const y = parseInt(birthYear, 10);
        const cy = new Date().getFullYear();
        if (y > cy || y < 1900) e.birthYear = 'Please enter a valid birth year';
        else if (cy - y < 13) e.birthYear = 'You must be at least 13 years old';
      }
      if (!agreeTerms) e.terms = 'You must agree to the terms';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password, confirmPassword, birthYear, agreeTerms, isSignup]);

  const handleSubmit = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      if (!validate()) return;
      setLoading(true);
      try {
        if (isSignup) {
          const { error } = await signUp(email, password, '', (role as any) || 'both', 'en');
          if (error) {
            setErrors({ form: error.message });
          } else {
            router.push('/(auth)/trail-name');
          }
        } else {
          const { error } = await signIn(email, password);
          if (error) {
            setErrors({ form: error.message });
          } else {
            router.replace('/(tabs)/map');
          }
        }
      } catch {
        setErrors({ form: 'An unexpected error occurred' });
      } finally {
        setLoading(false);
      }
    },
    [validate, isSignup, signUp, signIn, email, password, role, router]
  );

  const handleGoogle = useCallback(async () => {
    const { error } = await signInWithGoogle();
    if (error) setErrors({ form: error.message });
  }, [signInWithGoogle]);

  // === Inline styles (no Tailwind / NativeWind / RNW — pure CSS for clean DOM) ===
  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.bg,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: colors.ink,
  };

  const container: React.CSSProperties = {
    maxWidth: 480,
    margin: '0 auto',
    padding: '20px 24px 40px',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    boxSizing: 'border-box' as const,
  };

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 24,
  };

  const backBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: 16,
    color: colors.ink2,
    cursor: 'pointer',
    padding: '8px 12px 8px 0',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: colors.ink,
    margin: 0,
    flex: 1,
    textAlign: 'center',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 15,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 1.5,
  };

  const errorBanner: React.CSSProperties = {
    backgroundColor: colors.redBg,
    color: colors.red,
    padding: '12px 14px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  };

  const fieldGroup: React.CSSProperties = {
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: colors.ink2,
    marginBottom: 8,
    letterSpacing: 0.3,
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    lineHeight: 1.5,
    color: colors.ink,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    WebkitAppearance: 'none' as any,
    appearance: 'none' as any,
    outline: 'none',
  };

  const errorText: React.CSSProperties = {
    fontSize: 13,
    color: colors.red,
    marginTop: 6,
    lineHeight: 1.4,
  };

  const helperText: React.CSSProperties = {
    fontSize: 13,
    color: colors.ink3,
    marginTop: 6,
    lineHeight: 1.4,
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: 16,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: colors.amber,
    border: 'none',
    borderRadius: radii.md,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'inherit',
    marginTop: 8,
  };

  const dividerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0 12px',
  };

  const dividerLine: React.CSSProperties = {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLt,
  };

  const dividerText: React.CSSProperties = {
    fontSize: 13,
    color: colors.ink3,
  };

  const oauthBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    color: colors.ink,
    backgroundColor: colors.surface,
    border: `1.5px solid ${colors.borderLt}`,
    borderRadius: radii.md,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const appleBtn: React.CSSProperties = {
    ...oauthBtn,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: '#000',
    border: 'none',
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  const linkBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: colors.amber,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '12px',
    marginTop: 8,
    fontFamily: 'inherit',
  };

  const checkboxRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    margin: '20px 0 8px',
  };

  // === Form content ===
  const formContent = (
    <div style={overlay}>
      <div style={container}>
        <div style={headerRow}>
          <button
            type="button"
            style={backBtn}
            onClick={() => router.back()}
            aria-label="Back"
          >
            ← Back
          </button>
          <h1 style={titleStyle}>{title}</h1>
          <div style={{ width: 60 }} />
        </div>

        <p style={subtitleStyle}>{subtitle}</p>

        {errors.form && <div style={errorBanner}>{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate autoComplete="on">
          <div style={fieldGroup}>
            <label htmlFor="wk-email" style={labelStyle}>Email</label>
            <input
              id="wk-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="email"
              enterKeyHint={isSignup ? 'next' : 'done'}
              style={inputBase}
            />
            {errors.email && <div style={errorText}>{errors.email}</div>}
          </div>

          <div style={fieldGroup}>
            <label htmlFor="wk-password" style={labelStyle}>Password</label>
            <input
              id="wk-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              spellCheck={false}
              inputMode="text"
              enterKeyHint={isSignup ? 'next' : 'done'}
              style={inputBase}
            />
            {errors.password && <div style={errorText}>{errors.password}</div>}
          </div>

          {isSignup && (
            <>
              <div style={fieldGroup}>
                <label htmlFor="wk-confirm-password" style={labelStyle}>Confirm Password</label>
                <input
                  id="wk-confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="next"
                  style={inputBase}
                />
                {errors.confirmPassword && <div style={errorText}>{errors.confirmPassword}</div>}
              </div>

              <div style={fieldGroup}>
                <label htmlFor="wk-birth-year" style={labelStyle}>Birth Year</label>
                <input
                  id="wk-birth-year"
                  name="birth-year"
                  type="text"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1990"
                  autoComplete="bday-year"
                  inputMode="numeric"
                  enterKeyHint="done"
                  maxLength={4}
                  style={inputBase}
                />
                {errors.birthYear ? (
                  <div style={errorText}>{errors.birthYear}</div>
                ) : (
                  <div style={helperText}>You must be at least 13 years old</div>
                )}
              </div>

              <div style={checkboxRow}>
                <input
                  type="checkbox"
                  id="wk-agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: 4, width: 18, height: 18, accentColor: colors.amber }}
                />
                <label
                  htmlFor="wk-agree"
                  style={{
                    fontSize: 13,
                    color: colors.ink2,
                    lineHeight: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  I agree to the{' '}
                  <span style={{ color: colors.amber, fontWeight: 600 }}>Terms of Service</span>{' '}
                  and{' '}
                  <span style={{ color: colors.amber, fontWeight: 600 }}>Privacy Policy</span>
                </label>
              </div>
              {errors.terms && <div style={errorText}>{errors.terms}</div>}
            </>
          )}

          <button type="submit" style={primaryBtn} disabled={loading}>
            {loading ? '…' : submitLabel}
          </button>
        </form>

        <div style={dividerRow}>
          <div style={dividerLine} />
          <span style={dividerText}>or</span>
          <div style={dividerLine} />
        </div>

        <button type="button" style={oauthBtn} onClick={handleGoogle}>
          <span style={{ fontSize: 18 }}>G</span>
          Continue with Google
        </button>

        <button type="button" style={appleBtn} disabled>
          <span style={{ fontSize: 18 }}>⌘</span>
          Continue with Apple
        </button>

        <button
          type="button"
          style={linkBtn}
          onClick={() => router.push(isSignup ? '/(auth)/signin' : '/(auth)/signup')}
        >
          {isSignup ? 'Already a Wanderkind? Sign in' : 'New here? Become a Wanderkind'}
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(formContent, document.body);
}
