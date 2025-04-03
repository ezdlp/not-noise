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
const SUPABASE_URL = process.env.SUPABASE_URL || "https://owtufhdsuuyrgmxytclj.supabase.co";
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

// Date of the WordPress import
const WORDPRESS_IMPORT_DATE = '2025-02-13T13:44:38.316817+00:00';

async function diagnoseWordPressUsers() {
  try {
    console.log('Analyzing WordPress imported users...');
    
    // 1. Get WordPress imported users (based on the specific creation timestamp)
    const { data: wordpressUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name, artist_name')
      .eq('created_at', WORDPRESS_IMPORT_DATE);
    
    if (usersError) {
      console.error('Error fetching WordPress users:', usersError);
      return;
    }
    
    console.log(`Found ${wordpressUsers.length} WordPress imported users`);
    
    // 2. Check each user's subscription status
    const results = {
      usersWithoutSubscriptions: [],
      usersWithMultipleSubscriptions: [],
      usersWithStripeButNoSubscription: [],
      usersWithMismatchedPlans: []
    };
    
    for (const user of wordpressUsers) {
      // Get user's subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      if (subError) {
        console.error(`Error fetching subscriptions for user ${user.id}:`, subError);
        continue;
      }
      
      // Check for subscription issues
      if (!subscriptions || subscriptions.length === 0) {
        results.usersWithoutSubscriptions.push(user);
      } else if (subscriptions.length > 1) {
        results.usersWithMultipleSubscriptions.push({
          user,
          subscriptions: subscriptions.map(s => ({
            id: s.id,
            tier: s.tier,
            status: s.status,
            created_at: s.created_at
          }))
        });
      }
      
      // Check for users with Stripe info but no subscription
      const hasStripeInfo = subscriptions.some(s => 
        s.stripe_customer_id || s.stripe_subscription_id
      );
      
      const hasPaidSubscription = subscriptions.some(s => 
        s.tier !== 'free' && s.status === 'active'
      );
      
      if (hasStripeInfo && !hasPaidSubscription) {
        results.usersWithStripeButNoSubscription.push({
          user,
          subscriptions: subscriptions.map(s => ({
            id: s.id,
            tier: s.tier,
            status: s.status,
            stripe_subscription_id: s.stripe_subscription_id,
            stripe_customer_id: s.stripe_customer_id
          }))
        });
      }
    }
    
    // Output results
    console.log('\n=== DIAGNOSIS RESULTS ===\n');
    
    console.log(`WordPress users without subscriptions: ${results.usersWithoutSubscriptions.length}`);
    console.log(`WordPress users with multiple subscriptions: ${results.usersWithMultipleSubscriptions.length}`);
    console.log(`WordPress users with Stripe info but no paid subscription: ${results.usersWithStripeButNoSubscription.length}`);
    
    // Save detailed results to file
    const resultsPath = path.resolve(__dirname, '../wordpress_users_diagnosis.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nDetailed results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseWordPressUsers(); 