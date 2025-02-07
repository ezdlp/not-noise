
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSubscription(event: any) {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!userId) {
    console.error('No user ID in session metadata');
    return;
  }

  console.log(`Processing subscription update for user ${userId}`);
  console.log('Session data:', JSON.stringify(session, null, 2));

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  
  console.log('Subscription data:', JSON.stringify(subscription, null, 2));

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      tier: 'pro',
      status: subscription.status,
      payment_status: 'paid',
      billing_period: subscription.items.data[0].plan.interval === 'year' ? 'annual' : 'monthly',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      last_payment_date: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`Successfully updated subscription for user ${userId}`);
}

async function handleSubscriptionDeleted(event: any) {
  const subscription = event.data.object;
  console.log('Processing subscription deletion:', JSON.stringify(subscription, null, 2));

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      tier: 'free',
      cancel_at_period_end: true,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }

  console.log(`Successfully handled subscription deletion for subscription ${subscription.id}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request');
    
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ 
          error: 'Missing stripe signature', 
          code: 'missing_signature' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Received stripe-signature:', signature);

    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret in environment');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          code: 'missing_webhook_secret'
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the raw body
    const body = await req.text();
    console.log('Received webhook body (first 100 chars):', body.substring(0, 100));

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('Successfully constructed event:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signature,
        bodyPreview: body.substring(0, 100)
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid signature', 
          code: 'invalid_signature',
          details: err.message
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await updateSubscription(event);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error('Error processing webhook event:', {
        eventType: event.type,
        error: err.message,
        stack: err.stack
      });
      return new Response(
        JSON.stringify({ 
          error: 'Event processing failed', 
          code: 'processing_error',
          details: err.message
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ received: true }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Unexpected error processing webhook:', {
      error: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error', 
        code: 'internal_error',
        details: error.message 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
