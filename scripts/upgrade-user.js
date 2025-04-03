#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// User ID for Jarrod Parker
const JARROD_USER_ID = "7149c5a4-b45e-4ac3-a7aa-0cdbd43487f1";

async function upgradeUserToPro() {
  try {
    console.log(`Upgrading user ${JARROD_USER_ID} to Pro plan...`);
    
    // First, check if user already has subscriptions
    const { data: existingSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', JARROD_USER_ID);
    
    if (fetchError) {
      console.error('Error checking existing subscriptions:', fetchError);
      return;
    }
    
    console.log(`Found ${existingSubscriptions.length} existing subscription records`);
    
    // Calculate period dates (1 year from now for annual plan)
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log('User has existing subscription records. Updating the most recent one to Pro...');
      
      // Sort subscriptions by created_at date (newest first)
      const sortedSubscriptions = [...existingSubscriptions].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      const mostRecentSubscription = sortedSubscriptions[0];
      console.log('Most recent subscription ID:', mostRecentSubscription.id);
      
      // Update the most recent subscription to Pro
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          tier: 'pro',
          billing_period: 'annual',
          status: 'active',
          payment_status: 'paid',
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', mostRecentSubscription.id)
        .select();
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return;
      }
      
      console.log('✅ Successfully updated subscription to Pro');
      console.log(updatedSubscription);
      
      // Mark all other subscriptions as inactive
      if (existingSubscriptions.length > 1) {
        console.log('Marking all other subscriptions as inactive...');
        
        const otherSubscriptionIds = sortedSubscriptions
          .slice(1)
          .map(sub => sub.id);
        
        const { error: inactivateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'inactive',
            updated_at: now.toISOString()
          })
          .in('id', otherSubscriptionIds);
        
        if (inactivateError) {
          console.error('Error inactivating old subscriptions:', inactivateError);
        } else {
          console.log(`✅ Successfully marked ${otherSubscriptionIds.length} old subscriptions as inactive`);
        }
      }
    } else {
      console.log('Creating new Pro subscription for user...');
      
      // Create new subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          id: uuidv4(),
          user_id: JARROD_USER_ID,
          tier: 'pro',
          billing_period: 'annual',
          status: 'active',
          payment_status: 'paid',
          is_early_adopter: false,
          is_lifetime: false,
          cancel_at_period_end: false,
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select();
      
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return;
      }
      
      console.log('✅ Successfully created Pro subscription');
      console.log(newSubscription);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the upgrade
upgradeUserToPro(); 