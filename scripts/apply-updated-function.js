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

async function applyUpdatedFunction() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/update-analytics-function.sql', 'utf8');
    
    console.log('Applying updated analytics function to Supabase...');
    
    // Split the SQL into statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      // Create a temporary function to execute the SQL
      const tempFunctionName = `temp_exec_${Date.now()}`;
      const tempFunctionSql = `
        CREATE OR REPLACE FUNCTION ${tempFunctionName}()
        RETURNS void AS $$
        BEGIN
          ${statement};
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // Execute the temporary function
      const { data, error } = await supabase.rpc(tempFunctionName);
      
      if (error) {
        console.error(`Error executing SQL statement: ${error.message}`);
        console.log('Trying direct SQL execution...');
        
        // Try to execute the SQL directly using the REST API
        const { error: directError } = await supabase.from('_sql').select('*').eq('query', statement);
        
        if (directError) {
          console.error('Error with direct SQL execution:', directError);
        } else {
          console.log('SQL executed successfully via direct method.');
        }
      } else {
        console.log('SQL executed successfully.');
      }
      
      // Drop the temporary function
      const dropFunctionSql = `DROP FUNCTION IF EXISTS ${tempFunctionName}();`;
      await supabase.rpc(tempFunctionName, { sql: dropFunctionSql });
    }
    
    console.log('\nFunction update completed. Testing the updated function...');
    
    // Test the updated function
    const { data, error } = await supabase.rpc('get_improved_analytics_stats', {
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      p_end_date: new Date().toISOString() // now
    });
    
    if (error) {
      console.error('Error testing updated function:', error);
    } else {
      console.log(`✅ Function works! Retrieved ${data.length} rows of data.`);
      console.log('\nSample data:');
      console.log(data.slice(0, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Alternative approach using the Supabase REST API
async function applyFunctionViaREST() {
  try {
    console.log('Attempting to apply function via REST API...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/update-analytics-function.sql', 'utf8');
    
    // Make a POST request to the Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_improved_analytics_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Function works! Retrieved ${data.length} rows of data.`);
      console.log('\nSample data:');
      console.log(data.slice(0, 2));
    } else {
      console.error('Error testing function via REST API:', await response.text());
      console.log('\nAttempting to create the function...');
      
      // Try to create the function via the SQL API
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
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
      
      if (sqlResponse.ok) {
        console.log('Function created successfully via SQL API.');
        
        // Test the function again
        const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_improved_analytics_stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            p_end_date: new Date().toISOString()
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`✅ Function now works! Retrieved ${testData.length} rows of data.`);
        } else {
          console.error('Error testing function after creation:', await testResponse.text());
        }
      } else {
        console.error('Error creating function via SQL API:', await sqlResponse.text());
      }
    }
  } catch (err) {
    console.error('Error with REST approach:', err);
  }
}

// Try both approaches
async function main() {
  try {
    await applyUpdatedFunction();
  } catch (err) {
    console.error('Error with first approach:', err);
    console.log('\nTrying alternative approach...');
    await applyFunctionViaREST();
  }
}

main(); 