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

async function createAndListTables() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/create-list-tables-function.sql', 'utf8');
    
    console.log('Creating list_all_tables function...');
    
    // Execute the SQL to create the function
    const { error: createError } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (createError) {
      // If the exec_sql function doesn't exist, we'll try a different approach
      if (createError.message.includes('function does not exist')) {
        console.log('exec_sql function not available. Using direct SQL query...');
        
        // Try to execute the SQL directly using the REST API
        const { error: directError } = await supabase.from('_sql').select('*').eq('query', sqlContent);
        
        if (directError) {
          console.error('Error creating function:', directError);
          console.log('\nFalling back to simpler approach...');
          await listTablesSimple();
          return;
        }
      } else {
        console.error('Error creating function:', createError);
        console.log('\nFalling back to simpler approach...');
        await listTablesSimple();
        return;
      }
    }
    
    console.log('Function created successfully. Listing tables...');
    
    // Call the function to list tables
    const { data, error } = await supabase.rpc('list_all_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      console.log('\nFalling back to simpler approach...');
      await listTablesSimple();
      return;
    }
    
    if (data && data.length > 0) {
      // Group tables by schema
      const tablesBySchema = data.reduce((acc, table) => {
        if (!acc[table.schema_name]) {
          acc[table.schema_name] = [];
        }
        acc[table.schema_name].push(table.table_name);
        return acc;
      }, {});
      
      // Print tables by schema
      Object.keys(tablesBySchema).forEach(schema => {
        console.log(`\nTables in ${schema} schema:`);
        tablesBySchema[schema].forEach((table, index) => {
          console.log(`${index + 1}. ${table}`);
        });
      });
      
      console.log(`\nTotal: ${data.length} tables`);
    } else {
      console.log('No tables found or insufficient permissions to list them.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

async function listTablesSimple() {
  try {
    // Try to get a list of tables by querying a system view
    console.log('Attempting to list tables using a simple query...');
    
    // Try to query the analytics_page_views table to see if it exists
    const { data: pageViewsData, error: pageViewsError } = await supabase
      .from('analytics_page_views')
      .select('id')
      .limit(1);
    
    if (!pageViewsError) {
      console.log('✅ Table exists: analytics_page_views');
    } else {
      console.log('❌ Table does not exist: analytics_page_views');
    }
    
    // Try to query the link_views table to see if it exists
    const { data: linkViewsData, error: linkViewsError } = await supabase
      .from('link_views')
      .select('id')
      .limit(1);
    
    if (!linkViewsError) {
      console.log('✅ Table exists: link_views');
    } else {
      console.log('❌ Table does not exist: link_views');
    }
    
    // Try to query the analytics_events table to see if it exists
    const { data: eventsData, error: eventsError } = await supabase
      .from('analytics_events')
      .select('id')
      .limit(1);
    
    if (!eventsError) {
      console.log('✅ Table exists: analytics_events');
    } else {
      console.log('❌ Table does not exist: analytics_events');
    }
    
    // Try to query the subscriptions table to see if it exists
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    if (!subscriptionsError) {
      console.log('✅ Table exists: subscriptions');
    } else {
      console.log('❌ Table does not exist: subscriptions');
    }
    
    // Try to query the payments table to see if it exists
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);
    
    if (!paymentsError) {
      console.log('✅ Table exists: payments');
    } else {
      console.log('❌ Table does not exist: payments');
    }
    
    // Try to query the smart_links table to see if it exists
    const { data: smartLinksData, error: smartLinksError } = await supabase
      .from('smart_links')
      .select('id')
      .limit(1);
    
    if (!smartLinksError) {
      console.log('✅ Table exists: smart_links');
    } else {
      console.log('❌ Table does not exist: smart_links');
    }
    
  } catch (err) {
    console.error('Error in simple table check:', err);
  }
}

createAndListTables(); 