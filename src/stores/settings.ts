/**
 * Settings store — persists user preferences to Supabase profile
 * and provides reactive state across the app.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

const THEME_KEY = 'wk-theme-preference';

// Best-effort hydrate from AsyncStorage at module load. The store is
// created with a default of 'system' and updates synchronously when the
// stored preference resolves.
async function hydrateThemeFromStorage() {
  try {
    const v = await AsyncStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') {
      useSettings.setState({ theme: v });
    }
  } catch {
    // best effort
  }
}

export type AppTheme = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl' | 'pl' | 'cz' | 'sk' | 'hu' | 'ro' | 'sv' | 'no' | 'da' | 'el';

type SettingsState = {
  theme: AppTheme;
  language: AppLanguage;
  textSize: number; // 0 = small, 0.25, 0.5, 0.75, 1 = large
  reduceMotion: boolean;
  highContrast: boolean;
  notifications: {
    messages: boolean;
    bookingRequests: boolean;
    moments: boolean;
    systemUpdates: boolean;
  };

  // Actions
  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;
  setTextSize: (size: number) => void;
  setReduceMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setNotification: (key: keyof SettingsState['notifications'], value: boolean) => void;
  loadFromProfile: (profile: any) => void;
};

const persistToProfile = async (updates: Record<string, any>) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);
  } catch (err) {
    console.error('Failed to persist setting:', err);
  }
};

export const useSettings = create<SettingsState>((set) => ({
  theme: 'system',
  language: 'en',
  textSize: 0.5,
  reduceMotion: false,
  highContrast: false,
  notifications: {
    messages: true,
    bookingRequests: true,
    moments: true,
    systemUpdates: false,
  },

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
    persistToProfile({ theme });
    toast.success(`Theme: ${theme}`);
  },

  setLanguage: (language) => {
    set({ language });
    persistToProfile({ language });
    toast.success(`Language updated`);
  },

  setTextSize: (textSize) => {
    set({ textSize });
    persistToProfile({ text_size: textSize });
  },

  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
    persistToProfile({ reduce_motion: reduceMotion });
  },

  setHighContrast: (highContrast) => {
    set({ highContrast });
    persistToProfile({ high_contrast: highContrast });
  },

  setNotification: (key, value) => {
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    }));
    // Persist notification prefs as JSON
    const current = useSettings.getState().notifications;
    persistToProfile({ notification_prefs: { ...current, [key]: value } });
  },

  loadFromProfile: (profile) => {
    if (!profile) return;
    set({
      theme: profile.theme || 'light',
      language: profile.language || 'en',
      textSize: profile.text_size ?? 0.5,
      reduceMotion: profile.reduce_motion ?? false,
      highContrast: profile.high_contrast ?? false,
      notifications: profile.notification_prefs ?? {
        messages: true,
        bookingRequests: true,
        moments: true,
        systemUpdates: false,
      },
    });
  },
}));

// Fire-and-forget hydration on import
hydrateThemeFromStorage();
