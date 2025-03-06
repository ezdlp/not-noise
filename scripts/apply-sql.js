import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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

async function applySQLToSupabase() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/update-analytics-function.sql', 'utf8');
    
    console.log('Applying SQL to Supabase via REST API...');
    
    // Make a POST request to the Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('SQL applied successfully!');
    } else {
      console.error('Error applying SQL:', await response.text());
    }
    
    // Test the function
    console.log('\nTesting the get_improved_analytics_stats function...');
    
    const testResponse = await supabase.rpc('get_improved_analytics_stats', {
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_end_date: new Date().toISOString()
    });
    
    if (testResponse.error) {
      console.error('Error testing function:', testResponse.error);
    } else {
      console.log(`✅ Function works! Retrieved ${testResponse.data.length} rows of data.`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applySQLToSupabase(); 