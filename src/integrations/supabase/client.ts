
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://owtufhdsuuyrgmxytclj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc";

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

export const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  options
);

// Helper function to handle storage URLs consistently
export const getStoragePublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl; // v2 uses lowercase 'publicUrl'
};
