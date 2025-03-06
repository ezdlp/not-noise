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

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Test a simple query using the Supabase client
    const { data, error } = await supabase.rpc('get_improved_analytics_stats', {
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      p_end_date: new Date().toISOString() // now
    });
    
    if (error) {
      console.error('Error executing function:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log(`Retrieved ${data.length} rows of analytics data.`);
    
    // List available functions
    console.log('\nListing available functions:');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('pronamespace', 'public');
    
    if (funcError) {
      console.error('Error listing functions:', funcError);
      return;
    }
    
    if (functions && functions.length > 0) {
      functions.forEach(func => {
        console.log(`- ${func.proname}`);
      });
    } else {
      console.log('No functions found or insufficient permissions to list them.');
    }
    
    console.log('\nConnection test completed successfully!');
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
  }
}

testConnection(); 