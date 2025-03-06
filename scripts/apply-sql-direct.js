import dotenv from 'dotenv';
import fs from 'fs';

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

async function applySQLDirectly() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/update-analytics-function.sql', 'utf8');
    
    console.log('Applying SQL directly to Supabase...');
    
    // Make a POST request to the Supabase SQL API
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('SQL applied successfully!');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.error('Error applying SQL:', await response.text());
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applySQLDirectly(); 