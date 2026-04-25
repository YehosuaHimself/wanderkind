import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth';

type FavoritesState = {
  favoriteHostIds: Set<string>;
  isLoading: boolean;
  toggleFavorite: (hostId: string) => Promise<void>;
  isFavorite: (hostId: string) => boolean;
  loadFavorites: (userId: string) => Promise<void>;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteHostIds: new Set(),
  isLoading: false,

  toggleFavorite: async (hostId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isFav = get().isFavorite(hostId);

    // Optimistic update
    set(state => {
      const newFavorites = new Set(state.favoriteHostIds);
      if (isFav) {
        newFavorites.delete(hostId);
      } else {
        newFavorites.add(hostId);
      }
      return { favoriteHostIds: newFavorites };
    });

    try {
      if (isFav) {
        // Remove favorite
        await supabase
          .from('favorite_hosts')
          .delete()
          .eq('user_id', user.id)
          .eq('host_id', hostId);
      } else {
        // Add favorite
        await supabase
          .from('favorite_hosts')
          .insert({
            user_id: user.id,
            host_id: hostId,
            created_at: new Date().toISOString(),
          });
      }
    } catch (err) {
      // Revert on error
      set(state => {
        const newFavorites = new Set(state.favoriteHostIds);
        if (isFav) {
          newFavorites.add(hostId);
        } else {
          newFavorites.delete(hostId);
        }
        return { favoriteHostIds: newFavorites };
      });
      console.error('Failed to toggle favorite:', err);
    }
  },

  isFavorite: (hostId: string) => {
    return get().favoriteHostIds.has(hostId);
  },

  loadFavorites: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('favorite_hosts')
        .select('host_id')
        .eq('user_id', userId);

      if (!error && data) {
        const favorites = new Set(data.map(row => row.host_id));
        set({ favoriteHostIds: favorites });
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
