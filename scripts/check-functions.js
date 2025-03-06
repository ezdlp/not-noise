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

// List of functions to check
const functionsToCheck = [
  {
    name: 'get_improved_analytics_stats',
    params: {
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      p_end_date: new Date().toISOString() // now
    }
  },
  {
    name: 'get_monthly_active_users',
    params: {}
  },
  {
    name: 'get_pro_feature_usage',
    params: {}
  }
];

async function checkFunctions() {
  console.log('Checking for analytics functions in Supabase...');
  
  for (const func of functionsToCheck) {
    try {
      // Try to call the function with its parameters
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        if (error.message.includes('function does not exist')) {
          console.log(`❌ Function '${func.name}' does not exist.`);
        } else if (error.message.includes('missing required argument')) {
          // If we get a "missing argument" error, the function exists but needs parameters
          console.log(`❓ Function '${func.name}' exists but requires parameters: ${error.message}`);
        } else {
          console.log(`❓ Function '${func.name}' check resulted in error: ${error.message}`);
        }
      } else {
        console.log(`✅ Function '${func.name}' exists and returned ${data ? data.length : 0} rows of data.`);
      }
    } catch (err) {
      console.error(`Error checking function '${func.name}':`, err);
    }
  }
  
  console.log('\nFunction check completed.');
}

checkFunctions(); 