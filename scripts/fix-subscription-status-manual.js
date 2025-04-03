#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function fixRemainingIssues() {
  try {
    console.log('===== MANUALLY FIXING REMAINING SUBSCRIPTION ISSUES =====\n');
    
    // First, get all users with stripe data subscriptions
    console.log('Finding users with Stripe data...');
    
    const { data: stripeSubscriptions, error: stripeError } = await supabase
      .from('subscriptions')
      .select('user_id, id, tier, stripe_subscription_id, stripe_customer_id')
      .not('stripe_subscription_id', 'is', null);
    
    if (stripeError) {
      console.error('Error fetching stripe subscriptions:', stripeError);
      return;
    }
    
    console.log(`Found ${stripeSubscriptions.length} subscriptions with Stripe data\n`);
    
    // Group by user_id
    const userSubscriptionsMap = {};
    stripeSubscriptions.forEach(sub => {
      if (!userSubscriptionsMap[sub.user_id]) {
        userSubscriptionsMap[sub.user_id] = [];
      }
      userSubscriptionsMap[sub.user_id].push(sub);
    });
    
    // Process users with stripe data
    console.log(`Processing ${Object.keys(userSubscriptionsMap).length} users with Stripe data...\n`);
    
    for (const userId in userSubscriptionsMap) {
      const userSubs = userSubscriptionsMap[userId];
      
      // Skip users with only one subscription
      if (userSubs.length === 1) {
        continue;
      }
      
      console.log(`User ${userId} has ${userSubs.length} subscriptions with Stripe data`);
      
      // Get all subscriptions for this user
      const { data: allUserSubs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      if (subsError) {
        console.error(`Error fetching all subscriptions for user ${userId}:`, subsError);
        continue;
      }
      
      // Check for active subscriptions
      const activeSubscriptions = allUserSubs.filter(sub => sub.status === 'active');
      
      if (activeSubscriptions.length > 1) {
        console.log(`  User has ${activeSubscriptions.length} active subscriptions, deactivating extras...`);
        
        // Sort by tier and date (keep pro and newest)
        const sortedSubs = [...activeSubscriptions].sort((a, b) => {
          // Pro over free
          if (a.tier === 'pro' && b.tier !== 'pro') return -1;
          if (a.tier !== 'pro' && b.tier === 'pro') return 1;
          
          // Then newest first
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // Keep first, deactivate others
        const keepSub = sortedSubs[0];
        const deactivateIds = sortedSubs.slice(1).map(sub => sub.id);
        
        console.log(`  Keeping subscription ${keepSub.id} (${keepSub.tier})`);
        console.log(`  Deactivating: ${deactivateIds.join(', ')}`);
        
        // Deactivate extras
        const { error: deactivateError } = await supabase
          .from('subscriptions')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .in('id', deactivateIds);
        
        if (deactivateError) {
          console.error(`  Error deactivating subscriptions:`, deactivateError);
        } else {
          console.log(`  ✅ Successfully deactivated ${deactivateIds.length} subscriptions`);
        }
      } else if (activeSubscriptions.length === 0) {
        console.log(`  User has no active subscriptions, activating one with Stripe data...`);
        
        // Find subscription with stripe data and activate it
        const stripeSubscription = userSubs.find(sub => sub.stripe_subscription_id);
        
        if (stripeSubscription) {
          console.log(`  Activating subscription ${stripeSubscription.id}`);
          
          const { error: activateError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'active', 
              tier: 'pro', 
              updated_at: new Date().toISOString() 
            })
            .eq('id', stripeSubscription.id);
          
          if (activateError) {
            console.error(`  Error activating subscription:`, activateError);
          } else {
            console.log(`  ✅ Successfully activated subscription with Stripe data`);
          }
        } else {
          console.log(`  No subscription with Stripe data found`);
        }
      } else {
        console.log(`  User has exactly one active subscription already, skipping`);
      }
      
      console.log('');
    }
    
    console.log('\n===== MANUALLY FIXING COMPLETED =====');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixRemainingIssues(); 