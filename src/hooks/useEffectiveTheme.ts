/**
 * useEffectiveTheme — resolves the user's theme preference + the OS
 * appearance into a concrete 'light' | 'dark' value.
 *
 * Phase-1: the only consumer is the root layout, which uses the result
 *   to flip StatusBar style and set <html data-theme="…"> on web. A
 *   future ticket (WK-150 Phase-2) will rewire screen colours via a
 *   ThemeProvider so the swap is visible everywhere.
 */
import { useColorScheme } from 'react-native';
import { useSettings } from '../stores/settings';

export type EffectiveTheme = 'light' | 'dark';

export function useEffectiveTheme(): EffectiveTheme {
  const pref = useSettings(s => s.theme);
  const sys  = useColorScheme();
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return sys === 'dark' ? 'dark' : 'light';
}
