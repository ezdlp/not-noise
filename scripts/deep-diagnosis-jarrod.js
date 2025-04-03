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

// Jarrod Parker's user ID
const JARROD_USER_ID = '7149c5a4-b45e-4ac3-a7aa-0cdbd43487f1';

async function diagnoseSingleUser() {
  try {
    console.log('\n===== DEEP DIAGNOSIS FOR JARROD PARKER =====\n');
    
    // 1. Fetch profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', JARROD_USER_ID)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    console.log('PROFILE INFORMATION:');
    console.log(profile);
    
    // 2. Fetch all subscription records
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', JARROD_USER_ID);
    
    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return;
    }
    
    console.log('\nSUBSCRIPTION RECORDS:');
    console.log(subscriptions);
    
    // 3. Check for active subscription
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    console.log('\nACTIVE SUBSCRIPTION:');
    console.log(activeSubscription || 'None found');
    
    // 4. Check if subscription has proper tier and status
    if (activeSubscription) {
      console.log('\nSUBSCRIPTION STATUS CHECK:');
      console.log(`Tier: ${activeSubscription.tier}`);
      console.log(`Status: ${activeSubscription.status}`);
      console.log(`Payment Status: ${activeSubscription.payment_status}`);
      console.log(`Cancel at Period End: ${activeSubscription.cancel_at_period_end}`);
      console.log(`Current Period Start: ${activeSubscription.current_period_start}`);
      console.log(`Current Period End: ${activeSubscription.current_period_end}`);
      
      // Check if dates are valid
      const periodEnd = new Date(activeSubscription.current_period_end);
      const now = new Date();
      if (periodEnd < now) {
        console.log('WARNING: Subscription period has ended!');
      }
    }
    
    // 5. Check unique constraint and fix if needed
    console.log('\nTrying to fix subscription issues...');
    if (subscriptions.length > 0) {
      // Count active subscriptions
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      console.log(`Found ${activeSubscriptions.length} active subscriptions`);
      
      if (activeSubscriptions.length > 1) {
        console.log('ISSUE: Multiple active subscriptions detected. Fixing...');
        
        // Keep the most recent Pro subscription active and deactivate others
        const proSubscriptions = activeSubscriptions.filter(sub => sub.tier === 'pro');
        const sortedProSubs = [...proSubscriptions].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        
        if (sortedProSubs.length > 0) {
          const keepSubscription = sortedProSubs[0];
          const deactivateIds = subscriptions
            .filter(sub => sub.id !== keepSubscription.id)
            .map(sub => sub.id);
          
          console.log(`Keeping subscription: ${keepSubscription.id} (${keepSubscription.tier})`);
          console.log(`Deactivating subscriptions: ${deactivateIds.join(', ')}`);
          
          // Deactivate other subscriptions
          if (deactivateIds.length > 0) {
            const { error: deactivateError } = await supabase
              .from('subscriptions')
              .update({ status: 'inactive', updated_at: new Date().toISOString() })
              .in('id', deactivateIds);
            
            if (deactivateError) {
              console.error('Error deactivating subscriptions:', deactivateError);
            } else {
              console.log(`✅ Successfully deactivated ${deactivateIds.length} subscriptions`);
            }
          }
          
          // Make sure the kept subscription is set to Pro
          if (keepSubscription.tier !== 'pro') {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({ 
                tier: 'pro',
                updated_at: new Date().toISOString() 
              })
              .eq('id', keepSubscription.id);
            
            if (updateError) {
              console.error('Error updating kept subscription to Pro:', updateError);
            } else {
              console.log('✅ Successfully set kept subscription to Pro tier');
            }
          }
        } else {
          console.log('No Pro subscriptions found to keep');
        }
      } else if (activeSubscriptions.length === 0) {
        // No active subscriptions, activate the most recent one with Stripe data
        const subscriptionsWithStripe = subscriptions.filter(
          sub => sub.stripe_subscription_id || sub.stripe_customer_id
        );
        
        if (subscriptionsWithStripe.length > 0) {
          const sortedStripeSubscriptions = [...subscriptionsWithStripe].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          
          const activateSubscription = sortedStripeSubscriptions[0];
          console.log(`Activating subscription: ${activateSubscription.id}`);
          
          const now = new Date();
          const oneYearLater = new Date(now);
          oneYearLater.setFullYear(now.getFullYear() + 1);
          
          const { error: activateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              tier: 'pro',
              payment_status: 'paid',
              current_period_start: now.toISOString(),
              current_period_end: oneYearLater.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', activateSubscription.id);
          
          if (activateError) {
            console.error('Error activating subscription:', activateError);
          } else {
            console.log('✅ Successfully activated subscription with Pro tier');
          }
        } else {
          console.log('No subscriptions with Stripe data found to activate');
        }
      } else if (activeSubscriptions.length === 1 && activeSubscriptions[0].tier !== 'pro') {
        // Only one active subscription but not Pro, update it
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            tier: 'pro',
            updated_at: new Date().toISOString()
          })
          .eq('id', activeSubscriptions[0].id);
        
        if (updateError) {
          console.error('Error updating subscription to Pro:', updateError);
        } else {
          console.log('✅ Successfully updated subscription to Pro tier');
        }
      } else {
        console.log('Subscription appears to be correctly configured as Pro and active');
      }
    }
    
    // 6. Fetch updated subscriptions to confirm changes
    const { data: updatedSubscriptions, error: updatedSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', JARROD_USER_ID);
    
    if (updatedSubError) {
      console.error('Error fetching updated subscriptions:', updatedSubError);
      return;
    }
    
    console.log('\nUPDATED SUBSCRIPTION RECORDS:');
    console.log(updatedSubscriptions);
    
    const updatedActiveSubscription = updatedSubscriptions.find(sub => sub.status === 'active');
    console.log('\nUPDATED ACTIVE SUBSCRIPTION:');
    console.log(updatedActiveSubscription || 'None found');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseSingleUser();
