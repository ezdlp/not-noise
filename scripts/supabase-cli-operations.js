#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

if (!command || !['read', 'write', 'tables'].includes(command)) {
  console.log(`
Supabase CLI Operations
-----------------------
Usage: node supabase-cli-operations.js [command] [options]

Commands:
  read [table] [limit]     - Read data from a table (default limit: 10)
  write [table] [data]     - Write data to a table (data as JSON string)
  tables                   - List all tables in the database

Examples:
  node supabase-cli-operations.js read app_config 5
  node supabase-cli-operations.js write app_config '{"key": "test_key", "config_value": "test_value"}'
  node supabase-cli-operations.js tables
  `);
  process.exit(0);
}

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

console.log(`Connecting to Supabase: ${supabaseUrl}`);

async function listTables() {
  try {
    // First try: query information_schema for tables
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (schemaError) {
      console.error('❌ Error with information_schema approach:', schemaError);
      
      // Try another approach: Query a specific known table and see if it works
      try {
        console.log('Trying app_config table as a test...');
        const { data: configData, error: configError } = await supabase
          .from('app_config')
          .select('key')
          .limit(1);
        
        if (configError) {
          console.error('❌ Error querying app_config:', configError);
        } else {
          console.log('✅ Connection works! Found app_config table.');
          console.log('Sample data:', configData);
          
          // Try direct SQL approach
          console.log('\nTrying direct SQL to list tables...');
          const { data: sqlData, error: sqlError } = await supabase.rpc(
            'pgbouncer_control',
            { command: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" }
          );
          
          if (sqlError) {
            console.log('❌ Cannot list tables through SQL RPC either:', sqlError);
            console.log('\nSome known tables you can try to query directly:');
            console.log('- app_config');
            console.log('- auth.users');
            console.log('- playlists (if exists)');
            console.log('- smart_links (if exists)');
          } else {
            console.log('Tables found:', sqlData);
          }
        }
      } catch (innerError) {
        console.error('❌ All approaches failed:', innerError);
      }
      
      return;
    }
    
    console.log('Available tables:');
    schemaData.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
  } catch (error) {
    console.error('❌ Error querying tables:', error);
    
    // Fallback
    console.log('Connection might work, but cannot list all tables.');
    console.log('Try reading from a specific table like "app_config".');
  }
}

async function readData(tableName, limit = 10) {
  if (!tableName) {
    console.error('❌ Please provide a table name!');
    return;
  }
  
  try {
    console.log(`Reading up to ${limit} rows from "${tableName}"...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(parseInt(limit, 10));
    
    if (error) {
      console.error('❌ Error reading data:', error);
      return;
    }
    
    console.log(`✅ Successfully read ${data.length} rows from "${tableName}"`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error reading data:', error);
  }
}

async function writeData(tableName, jsonData) {
  if (!tableName) {
    console.error('❌ Please provide a table name!');
    return;
  }
  
  if (!jsonData) {
    console.error('❌ Please provide data to write!');
    return;
  }
  
  try {
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      console.error('❌ Invalid JSON data:', e);
      return;
    }
    
    console.log(`Writing data to "${tableName}"...`);
    console.log('Data:', data);
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      console.error('❌ Error writing data:', error);
      return;
    }
    
    console.log(`✅ Successfully wrote data to "${tableName}"`);
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Error writing data:', error);
  }
}

// Execute the requested command
async function main() {
  try {
    switch (command) {
      case 'tables':
        await listTables();
        break;
      case 'read':
        await readData(args[1], args[2]);
        break;
      case 'write':
        await writeData(args[1], args[2]);
        break;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main(); 