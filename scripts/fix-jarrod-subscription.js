
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

async function fixJarrodSubscription() {
  try {
    // Get Jarrod's user ID - (replace with actual email)
    const jarrodEmail = 'jarrod.parker@example.com'; // Replace with actual email
    
    console.log(`Finding user with email: ${jarrodEmail}`);
    const { data: userResponse, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', jarrodEmail)
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    const userId = userResponse.id;
    console.log(`Found user with ID: ${userId}`);
    
    // Get all subscriptions for this user
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);
    
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return;
    }
    
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    if (subscriptions.length === 0) {
      console.log('No subscriptions found for this user.');
      return;
    }
    
    // Sort to find the most recent subscription that should be active
    const sortedSubs = [...subscriptions].sort((a, b) => {
      // Pro over free
      if (a.tier === 'pro' && b.tier !== 'pro') return -1;
      if (a.tier !== 'pro' && b.tier === 'pro') return 1;
      
      // Then newest first
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    const primarySub = sortedSubs[0];
    
    console.log(`Primary subscription: ${primarySub.id} (${primarySub.tier})`);
    
    // Make all subscriptions match the primary one and set to active
    for (const sub of subscriptions) {
      console.log(`Updating subscription ${sub.id}...`);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          tier: primarySub.tier,
          current_period_start: primarySub.current_period_start,
          current_period_end: primarySub.current_period_end,
          stripe_customer_id: primarySub.stripe_customer_id,
          stripe_subscription_id: primarySub.stripe_subscription_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);
      
      if (updateError) {
        console.error(`Error updating subscription ${sub.id}:`, updateError);
      } else {
        console.log(`✅ Successfully updated subscription ${sub.id}`);
      }
    }
    
    console.log('\nFix completed. All of Jarrod\'s subscriptions are now active and synchronized.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixJarrodSubscription();
