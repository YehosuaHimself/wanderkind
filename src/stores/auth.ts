import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Platform, AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { useSettings } from './settings';
import { setSentryUser, clearSentryUser } from '../lib/sentry';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, trailName: string, role: 'walker' | 'host' | 'both', language: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  setOnboarded: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,

  initialize: async () => {
    try {
      // Clean up existing subscription before creating a new one
      const existingSub = (globalThis as any).__wanderkind_auth_sub;
      if (existingSub) {
        existingSub.unsubscribe();
        (globalThis as any).__wanderkind_auth_sub = null;
      }

      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        await get().fetchProfile();
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null, isOnboarded: false });
        }
      });

      // Store subscription for potential cleanup
      (globalThis as any).__wanderkind_auth_sub = subscription;

      // TM-06: Session freshness on web — refresh when tab becomes visible
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const handler = () => {
          if (document.visibilityState === 'visible') {
            get().refreshSession();
          }
        };
        // Remove previous listener if exists
        if ((globalThis as any).__wanderkind_visibility_handler) {
          document.removeEventListener('visibilitychange', (globalThis as any).__wanderkind_visibility_handler);
        }
        document.addEventListener('visibilitychange', handler);
        (globalThis as any).__wanderkind_visibility_handler = handler;
      } else {
        // Native: refresh on app foreground
        const appStateHandler = (nextState: string) => {
          if (nextState === 'active') {
            get().refreshSession();
          }
        };
        const sub = AppState.addEventListener('change', appStateHandler);
        (globalThis as any).__wanderkind_appstate_sub = sub;
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, trailName, role, language) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { trail_name: trailName, role, language },
      },
    });

    if (error) return { error };

    // Create full profile atomically with all required fields
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        trail_name: trailName,
        email,
        role,
        language,
        bio: null,
        avatar_url: null,
        cover_url: null,
        gallery: [],
        tier: 'wanderkind',
        nights_walked: 0,
        stamps_count: 0,
        hosts_stayed: 0,
        is_walking: false,
        is_hosting: role === 'host' || role === 'both',
        is_verified: false,
        verification_level: 'none',
        theme: 'light',
        ghost_presence: true,
        searchable: true,
        quiet_mode: false,
        show_location: false,
        show_walking_status: false,
        show_stats: false,
        show_on_map: true,
        show_profile_public: true,
        consent_analytics: false,
        consent_marketing: false,
        skills: [],
        emergency_contacts: [],
      });

      if (profileError) return { error: profileError as unknown as Error };
    }

    return { error: null };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  signInWithGoogle: async () => {
    try {
      // In iOS PWA standalone mode, text inputs don't work inside the
      // webview. We get the OAuth URL from Supabase but open it in a
      // real Safari window instead of doing an in-page redirect.
      const isStandalone = Platform.OS === 'web' && typeof window !== 'undefined' &&
        ((window.navigator as any).standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
            : 'wanderkind://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // In standalone PWA, don't let Supabase redirect — we'll open in Safari
          skipBrowserRedirect: isStandalone,
        },
      });

      // If in standalone mode, open the URL in Safari via window.open
      if (isStandalone && data?.url) {
        window.open(data.url, '_blank');
      }

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  },

  signInWithApple: async () => {
    try {
      const isStandalone = Platform.OS === 'web' && typeof window !== 'undefined' &&
        ((window.navigator as any).standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
            : 'wanderkind://auth/callback',
          skipBrowserRedirect: isStandalone,
        },
      });

      if (isStandalone && data?.url) {
        window.open(data.url, '_blank');
      }

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, isOnboarded: false });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch failed:', error.message);
        return;
      }

      if (data) {
        set({ profile: data as Profile, isOnboarded: true });
        // Load user settings from profile
        useSettings.getState().loadFromProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      set(state => ({
        profile: state.profile ? { ...state.profile, ...updates } as Profile : null,
      }));
    }

    return { error };
  },

  refreshSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Session expired — try to refresh the token
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          // Token is truly expired — clean logout
          set({ session: null, user: null, profile: null, isOnboarded: false });
          return;
        }
        set({ session: refreshData.session, user: refreshData.session.user });
      } else {
        set({ session, user: session.user });
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      // Network error during refresh — keep existing state, don't logout
    }
  },

  setOnboarded: () => set({ isOnboarded: true }),
}));

// Alias for convenience
export const useAuth = useAuthStore;
