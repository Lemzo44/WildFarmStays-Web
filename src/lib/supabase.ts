import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Check if Supabase should be used (feature flag, case-insensitive)
const rawFlag = (import.meta.env.VITE_USE_SUPABASE || '').toString();
const normalizedFlag = rawFlag.trim().toLowerCase();
export const useSupabase = normalizedFlag === 'true' && supabase !== null;

// Optional: tiny debug helper
if (typeof window !== 'undefined') {
  (window as any).__WFS_USE_SUPABASE__ = useSupabase;
}

