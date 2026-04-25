import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
// Database type is defined in ../types/database.ts for Row type safety.
// We intentionally omit the Database generic from createClient to avoid
// TypeScript type instantiation limits with 18+ tables. Row types are
// used at call sites for type-safe reads; mutations are validated by
// Supabase RLS and column constraints at runtime.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gjzhwpzgvdpkflgjesmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqemh3cHpndmRwa2ZsZ2plc21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mzc3OTUsImV4cCI6MjA5MjAxMzc5NX0.oHaNuCWu3FpMml2QhTpO7vFGxbgBEGo0mjKj5OUU7nI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});
