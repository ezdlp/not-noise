
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-02-24.acacia',
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 3,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check - only allow admin users to run this
    const authHeader = req.headers.get('Authorization')!;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');
        
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: 'Not authorized - admin role required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get the specific user ID to fix from the request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No user ID provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get the user's email to look up their Stripe customer
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (!userProfile?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Find the Stripe customer for this user
    const customers = await stripe.customers.list({
      email: userProfile.email,
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found for this user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const customerId = customers.data[0].id;
    
    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });
    
    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions found for this customer' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Process each subscription and find the most recent active one
    let activeSubscription = null;
    let newestSubscription = null;
    
    for (const subscription of subscriptions.data) {
      if (!newestSubscription || subscription.created > newestSubscription.created) {
        newestSubscription = subscription;
      }
      
      if (subscription.status === 'active' && (!activeSubscription || subscription.created > activeSubscription.created)) {
        activeSubscription = subscription;
      }
    }
    
    const subscriptionToUse = activeSubscription || newestSubscription;
    
    // Update the user's subscription in our database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionToUse.id,
        stripe_customer_id: customerId,
        tier: subscriptionToUse.status === 'active' ? 'pro' : 'free',
        status: subscriptionToUse.status,
        current_period_start: new Date(subscriptionToUse.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscriptionToUse.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscriptionToUse.cancel_at_period_end,
        billing_period: subscriptionToUse.items.data[0]?.plan.interval || 'monthly',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (subscriptionError) {
      return new Response(JSON.stringify({ error: `Error updating subscription: ${subscriptionError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Subscription updated for user ${userId}`,
      subscription: {
        id: subscriptionToUse.id,
        status: subscriptionToUse.status,
        tier: subscriptionToUse.status === 'active' ? 'pro' : 'free',
        current_period_end: new Date(subscriptionToUse.current_period_end * 1000).toISOString(),
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error fixing subscription:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
