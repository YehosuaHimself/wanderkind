import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, trailName: string, role: 'walker' | 'host' | 'both', language: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
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

    // Create profile
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
        is_verified: false,
        verification_level: 'none',
        theme: 'light',
        ghost_presence: true,
        searchable: true,
        quiet_mode: false,
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

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      set({ profile: data as Profile, isOnboarded: true });
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

  setOnboarded: () => set({ isOnboarded: true }),
}));

// Alias for convenience
export const useAuth = useAuthStore;
