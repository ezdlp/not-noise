#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Running Supabase connection test...');

// Print key environment variables (masking sensitive parts)
const projectRef = process.env.SUPABASE_PROJECT_REF || '';
console.log(`Project Ref: ${projectRef}`);

const supabaseUrl = `https://${projectRef}.supabase.co`;
console.log(`Supabase URL: ${supabaseUrl}`);

// Get auth keys from environment variables
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  supabaseUrl,
  SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'connection-test-script',
      },
    },
  }
);

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try a simple query to check connection
    const { data, error } = await supabase
      .from('app_config')
      .select('key')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Data sample:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 