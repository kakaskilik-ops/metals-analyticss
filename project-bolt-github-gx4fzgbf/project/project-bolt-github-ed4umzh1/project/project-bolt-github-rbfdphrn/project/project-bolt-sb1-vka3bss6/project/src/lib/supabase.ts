import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
