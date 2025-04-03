#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function runSqlMigrations() {
  try {
    console.log('===== RUNNING SQL MIGRATIONS =====\n');
    
    // Read the SQL migration files
    const helpersPath = path.resolve(__dirname, '../supabase/migrations/20250403_subscription_helpers.sql');
    const viewPath = path.resolve(__dirname, '../supabase/migrations/20250403_active_subscriptions_view.sql');
    
    // Read the SQL files
    const helpersSql = fs.readFileSync(helpersPath, 'utf8');
    const viewSql = fs.readFileSync(viewPath, 'utf8');
    
    // Split SQL into individual statements
    const splitSql = (sql) => {
      return sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
        .map(stmt => stmt + ';');
    };
    
    const helperStatements = splitSql(helpersSql);
    const viewStatements = splitSql(viewSql);
    
    // Execute the SQL statements one by one
    console.log('Running subscription helper functions...');
    
    for (let i = 0; i < helperStatements.length; i++) {
      const stmt = helperStatements[i];
      console.log(`\nExecuting statement ${i + 1}/${helperStatements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      try {
        // Try executing with RPC first
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (rpcError) {
          console.error(`RPC Error: ${rpcError.message}`);
          
          // Try direct query as fallback
          console.log('Trying direct query...');
          const { error: queryError } = await supabase.auth.admin.executeSql(stmt);
          
          if (queryError) {
            console.error(`Direct query error: ${queryError.message}`);
            console.log('\nPlease run this SQL statement manually in the Supabase dashboard:');
            console.log(stmt);
          } else {
            console.log('✅ Statement executed successfully via direct query');
          }
        } else {
          console.log('✅ Statement executed successfully via RPC');
        }
      } catch (error) {
        console.error(`Execution error: ${error.message}`);
        console.log('\nPlease run this SQL statement manually in the Supabase dashboard:');
        console.log(stmt);
      }
    }
    
    console.log('\nRunning active subscriptions view...');
    
    for (let i = 0; i < viewStatements.length; i++) {
      const stmt = viewStatements[i];
      console.log(`\nExecuting statement ${i + 1}/${viewStatements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      try {
        // Try executing with RPC first
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (rpcError) {
          console.error(`RPC Error: ${rpcError.message}`);
          
          // Try direct query as fallback
          console.log('Trying direct query...');
          const { error: queryError } = await supabase.auth.admin.executeSql(stmt);
          
          if (queryError) {
            console.error(`Direct query error: ${queryError.message}`);
            console.log('\nPlease run this SQL statement manually in the Supabase dashboard:');
            console.log(stmt);
          } else {
            console.log('✅ Statement executed successfully via direct query');
          }
        } else {
          console.log('✅ Statement executed successfully via RPC');
        }
      } catch (error) {
        console.error(`Execution error: ${error.message}`);
        console.log('\nPlease run this SQL statement manually in the Supabase dashboard:');
        console.log(stmt);
      }
    }
    
    console.log('\n===== SQL MIGRATIONS COMPLETE =====');
    console.log('If any statements failed, please run them manually in the Supabase dashboard.');
    console.log('The frontend code changes we made will take effect when you next deploy your application.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the migrations
runSqlMigrations(); 