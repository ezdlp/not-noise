import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Supabase URL and key from the environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://owtufhdsuuyrgmxytclj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: Supabase key not found in environment variables.');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY to your .env file.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('Listing tables in Supabase database...');
  
  try {
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .order('tablename');
    
    if (error) {
      console.error('Error listing tables:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('\nTables in public schema:');
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      console.log(`\nTotal: ${data.length} tables`);
    } else {
      console.log('No tables found or insufficient permissions to list them.');
    }
    
    // Also try to get auth schema tables
    const { data: authTables, error: authError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'auth')
      .order('tablename');
    
    if (!authError && authTables && authTables.length > 0) {
      console.log('\nTables in auth schema:');
      authTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

listTables(); 