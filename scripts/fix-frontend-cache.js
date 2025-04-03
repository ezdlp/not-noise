#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owtufhdsuuyrgmxytclj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

// Initialize Supabase client with service role key (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Jarrod Parker's user ID
const JARROD_USER_ID = '7149c5a4-b45e-4ac3-a7aa-0cdbd43487f1';

async function createCacheBusterToken() {
  try {
    console.log('Creating cache buster token for Jarrod Parker...');
    
    // Force a change in the subscription's updated_at timestamp
    // This will invalidate React Query's cache
    const now = new Date();
    
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        updated_at: now.toISOString(),
        last_payment_date: now.toISOString()
      })
      .eq('user_id', JARROD_USER_ID)
      .eq('status', 'active')
      .select();
    
    if (updateError) {
      console.error('Error updating timestamp:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated subscription timestamp to force cache invalidation');
    
    // Generate instructions for the user
    console.log('\n=== INSTRUCTIONS FOR JARROD ===');
    console.log('1. Close and reopen your browser');
    console.log('2. Clear browser cache: Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)');
    console.log('3. Make sure to check "Cached images and files" and "Cookies and site data"');
    console.log('4. Click "Clear data"');
    console.log('5. Navigate to soundraiser.com and log in again');
    console.log('\nIf the issue persists, try:');
    console.log('1. Open browser Developer Tools (F12 or Ctrl+Shift+I)');
    console.log('2. Go to Application tab > Storage > Clear Site Data');
    console.log('3. Reload the page\n');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createCacheBusterToken(); 