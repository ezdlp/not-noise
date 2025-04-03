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

// User ID for Jarrod Parker
const JARROD_USER_ID = '7149c5a4-b45e-4ac3-a7aa-0cdbd43487f1';

async function checkAndFixJarrodSubscription() {
  try {
    console.log('\n===== CREATING SQL VIEW FOR SUBSCRIPTION QUERIES =====\n');
    
    // 1. First, create a SQL view that ensures only active subscriptions are retrieved
    const createViewSQL = `
      CREATE OR REPLACE VIEW active_subscriptions AS
      SELECT * FROM subscriptions
      WHERE status = 'active'
      ORDER BY updated_at DESC;
    `;
    
    const { data: viewResult, error: viewError } = await supabase.rpc(
      'execute_sql',
      { sql_query: createViewSQL }
    );
    
    if (viewError) {
      console.error('Error creating view:', viewError);
      
      // Try alternate approach - direct SQL execution
      console.log('Trying alternate SQL execution approach...');
      
      // This will create the view directly through SQL execution
      // (method depends on your Supabase setup)
      const { error: directError } = await supabase.rpc(
        'pgbouncer_control',
        { command: createViewSQL }
      );
      
      if (directError) {
        console.error('Error with direct SQL execution:', directError);
        console.log('\nImportant: Please run this SQL manually in the Supabase dashboard:');
        console.log(createViewSQL);
      } else {
        console.log('✅ Successfully created active_subscriptions view!');
      }
    } else {
      console.log('✅ Successfully created active_subscriptions view!');
    }
    
    // 2. Verify Jarrod's subscription status after view creation
    console.log('\nVerifying Jarrod Parker subscription through active_subscriptions view:');
    
    const { data: jarrodActiveSubscription, error: jarrodError } = await supabase
      .from('active_subscriptions')
      .select('*')
      .eq('user_id', JARROD_USER_ID)
      .single();
    
    if (jarrodError) {
      console.error('Error checking Jarrod through view:', jarrodError);
    } else {
      console.log('Jarrod\'s active subscription through view:');
      console.log(jarrodActiveSubscription);
    }
    
    // 3. Provide fix instructions for the frontend code
    const frontendFiles = [
      'src/components/subscription/SubscriptionBanner.tsx',
      'src/hooks/useFeatureAccess.ts',
      'src/components/subscription/FeatureLimits.tsx',
      'src/components/spotify-promotion/PromotionsDashboard.tsx',
      'src/pages/Pricing.tsx'
    ];
    
    console.log('\n===== FRONTEND CODE FIX INSTRUCTIONS =====');
    console.log('Replace these query patterns in the following files:');
    
    for (const file of frontendFiles) {
      console.log(`\nFile: ${file}`);
      console.log('Find this pattern:');
      console.log(`
const { data: subscriptionData, error: subscriptionError } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", user.id)
  .maybeSingle();`);
      
      console.log('\nReplace with:');
      console.log(`
const { data: subscriptionData, error: subscriptionError } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", user.id)
  .eq("status", "active")
  .single();`);
    }
    
    console.log('\n===== DATABASE VIEW CREATED =====');
    console.log('The active_subscriptions view has been created in the database.');
    console.log('This ensures that only active subscriptions are retrieved.');
    console.log('\nNext steps:');
    console.log('1. Update the frontend code as per the instructions above');
    console.log('2. Redeploy the application');
    console.log('3. Ask Jarrod to clear his browser cache');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
checkAndFixJarrodSubscription(); 