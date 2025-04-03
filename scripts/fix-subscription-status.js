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

async function fixSubscriptionStatuses() {
  try {
    console.log('===== FIXING SUBSCRIPTION STATUSES =====');
    
    // 1. First, get counts before changes
    console.log('\nGetting initial subscription counts...');
    
    const { count: totalCount, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    const { count: nullStatusCount, error: nullCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .is('status', null);
    
    const { count: activeCount, error: activeCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: stripeWithoutActiveCount, error: stripeCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .not('stripe_subscription_id', 'is', null)
      .not('status', 'eq', 'active');
    
    if (countError || nullCountError || activeCountError || stripeCountError) {
      console.error('Error getting counts:', countError || nullCountError || activeCountError || stripeCountError);
    } else {
      console.log(`Total subscriptions: ${totalCount}`);
      console.log(`Subscriptions with NULL status: ${nullStatusCount}`);
      console.log(`Active subscriptions: ${activeCount}`);
      console.log(`Subscriptions with Stripe ID but not active: ${stripeWithoutActiveCount}`);
    }
    
    // 2. Set all subscriptions with NULL status to 'inactive'
    console.log('\nSetting NULL status subscriptions to inactive...');
    
    const { error: nullUpdateError } = await supabase
      .from('subscriptions')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .is('status', null);
    
    if (nullUpdateError) {
      console.error('Error updating NULL status subscriptions:', nullUpdateError);
    } else {
      console.log(`✅ Updated ${nullStatusCount} subscriptions with NULL status to 'inactive'`);
    }
    
    // 3. Ensure subscriptions with stripe_subscription_id have 'active' status
    console.log('\nSetting subscriptions with Stripe ID to active...');
    
    const { error: stripeUpdateError } = await supabase
      .from('subscriptions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .not('stripe_subscription_id', 'is', null)
      .not('status', 'eq', 'active');
    
    if (stripeUpdateError) {
      console.error('Error updating stripe subscriptions:', stripeUpdateError);
    } else {
      console.log(`✅ Updated ${stripeWithoutActiveCount} subscriptions with Stripe ID to 'active'`);
    }
    
    // 4. Handle cases where a user has multiple active subscriptions
    console.log('\nFixing users with multiple active subscriptions...');
    
    // First, identify users with multiple active subscriptions
    const { data: usersWithMultipleActive, error: multipleError } = await supabase
      .rpc('get_users_with_multiple_active_subscriptions');
    
    if (multipleError) {
      console.error('Error identifying users with multiple active subscriptions:', multipleError);
      
      // Fallback approach using direct SQL
      console.log('Trying direct query...');
      
      // Get all active subscriptions grouped by user_id
      const { data: activeSubscriptions, error: activeSubsError } = await supabase
        .from('subscriptions')
        .select('user_id, tier, created_at, id')
        .eq('status', 'active');
      
      if (activeSubsError) {
        console.error('Error fetching active subscriptions:', activeSubsError);
      } else {
        // Group by user_id
        const userSubscriptions = {};
        activeSubscriptions.forEach(sub => {
          if (!userSubscriptions[sub.user_id]) {
            userSubscriptions[sub.user_id] = [];
          }
          userSubscriptions[sub.user_id].push(sub);
        });
        
        // Find users with multiple active subscriptions
        const usersWithMultiple = Object.keys(userSubscriptions)
          .filter(userId => userSubscriptions[userId].length > 1)
          .map(userId => ({
            user_id: userId,
            subscription_count: userSubscriptions[userId].length,
            subscriptions: userSubscriptions[userId]
          }));
        
        console.log(`Found ${usersWithMultiple.length} users with multiple active subscriptions`);
        
        // Fix each user with multiple active subscriptions
        for (const user of usersWithMultiple) {
          console.log(`\nFixing user ${user.user_id} with ${user.subscription_count} active subscriptions`);
          
          // Sort subscriptions by tier (pro > free) and then by created_at (newest first)
          const sortedSubs = [...user.subscriptions].sort((a, b) => {
            // First prioritize pro over free
            if (a.tier === 'pro' && b.tier !== 'pro') return -1;
            if (a.tier !== 'pro' && b.tier === 'pro') return 1;
            
            // Then sort by created_at (newest first)
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          // Keep the first one active, deactivate others
          const keepSub = sortedSubs[0];
          const deactivateSubs = sortedSubs.slice(1);
          const deactivateIds = deactivateSubs.map(sub => sub.id);
          
          console.log(`  Keeping subscription ${keepSub.id} (${keepSub.tier}) active`);
          console.log(`  Deactivating subscriptions: ${deactivateIds.join(', ')}`);
          
          if (deactivateIds.length > 0) {
            const { error: deactivateError } = await supabase
              .from('subscriptions')
              .update({ status: 'inactive', updated_at: new Date().toISOString() })
              .in('id', deactivateIds);
            
            if (deactivateError) {
              console.error(`  Error deactivating subscriptions:`, deactivateError);
            } else {
              console.log(`  ✅ Successfully deactivated ${deactivateIds.length} subscriptions`);
            }
          }
        }
      }
    } else {
      console.log(`Found ${usersWithMultipleActive.length} users with multiple active subscriptions`);
      
      // Process each user with multiple active subscriptions
      for (const user of usersWithMultipleActive) {
        console.log(`\nFixing user ${user.user_id} with ${user.subscription_count} active subscriptions`);
        
        // Get all active subscriptions for this user
        const { data: userSubs, error: userSubsError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('status', 'active');
        
        if (userSubsError) {
          console.error(`Error fetching subscriptions for user ${user.user_id}:`, userSubsError);
          continue;
        }
        
        // Sort subscriptions by tier (pro > free) and then by created_at (newest first)
        const sortedSubs = [...userSubs].sort((a, b) => {
          // First prioritize pro over free
          if (a.tier === 'pro' && b.tier !== 'pro') return -1;
          if (a.tier !== 'pro' && b.tier === 'pro') return 1;
          
          // Then sort by created_at (newest first)
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // Keep the first one active, deactivate others
        const keepSub = sortedSubs[0];
        const deactivateSubs = sortedSubs.slice(1);
        const deactivateIds = deactivateSubs.map(sub => sub.id);
        
        console.log(`  Keeping subscription ${keepSub.id} (${keepSub.tier}) active`);
        console.log(`  Deactivating subscriptions: ${deactivateIds.join(', ')}`);
        
        if (deactivateIds.length > 0) {
          const { error: deactivateError } = await supabase
            .from('subscriptions')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .in('id', deactivateIds);
          
          if (deactivateError) {
            console.error(`  Error deactivating subscriptions:`, deactivateError);
          } else {
            console.log(`  ✅ Successfully deactivated ${deactivateIds.length} subscriptions`);
          }
        }
      }
    }
    
    // 5. Get counts after changes
    console.log('\nGetting final subscription counts...');
    
    const { count: finalTotalCount, error: finalCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalNullStatusCount, error: finalNullCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .is('status', null);
    
    const { count: finalActiveCount, error: finalActiveCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: finalStripeWithoutActiveCount, error: finalStripeCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .not('stripe_subscription_id', 'is', null)
      .not('status', 'eq', 'active');
    
    if (finalCountError || finalNullCountError || finalActiveCountError || finalStripeCountError) {
      console.error('Error getting final counts:', finalCountError || finalNullCountError || finalActiveCountError || finalStripeCountError);
    } else {
      console.log(`Total subscriptions: ${finalTotalCount}`);
      console.log(`Subscriptions with NULL status: ${finalNullStatusCount}`);
      console.log(`Active subscriptions: ${finalActiveCount}`);
      console.log(`Subscriptions with Stripe ID but not active: ${finalStripeWithoutActiveCount}`);
    }
    
    console.log('\n===== DATABASE FIX COMPLETED =====');
    console.log('All subscription status issues have been fixed.');
    console.log('The frontend code updates will ensure proper subscription retrieval.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
fixSubscriptionStatuses(); 