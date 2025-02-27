
import { createBrowserClient } from '@supabase/ssr';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a browser client for client-side usage
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Export types for better type safety
export type { Session, User } from '@supabase/supabase-js';
