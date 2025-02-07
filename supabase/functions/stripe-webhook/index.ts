
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with debug logging
console.log('Initializing Stripe webhook handler');
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
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
  // Debug log the request method and headers
  console.log('Webhook request received:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing webhook request');
    
    // Get and validate stripe signature
    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature header:', signature);

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ 
          error: 'Missing stripe signature', 
          code: 'missing_signature',
          debug: {
            headers: Object.fromEntries(req.headers.entries())
          }
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get and validate webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log('Webhook secret available:', !!webhookSecret);

    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret in environment');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          code: 'missing_webhook_secret',
          debug: {
            envVars: {
              webhookSecret: !!webhookSecret,
              stripeKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
            }
          }
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get raw body and log partial content for debugging
    const body = await req.text();
    console.log('Raw webhook body preview:', {
      length: body.length,
      preview: body.substring(0, 100),
      isValidJson: (() => {
        try {
          JSON.parse(body);
          return true;
        } catch (e) {
          return false;
        }
      })()
    });

    let event;
    try {
      console.log('Attempting to construct Stripe event with:', {
        bodyLength: body.length,
        signatureLength: signature.length,
        webhookSecretLength: webhookSecret.length
      });

      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      
      console.log('Successfully constructed event:', {
        type: event.type,
        id: event.id
      });
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signature,
        bodyPreview: body.substring(0, 100),
        stack: err.stack
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid signature', 
          code: 'invalid_signature',
          details: err.message,
          debug: {
            signatureHeader: signature,
            errorMessage: err.message,
            stack: err.stack
          }
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing webhook event:', {
      type: event.type,
      id: event.id
    });

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

      return new Response(
        JSON.stringify({ 
          received: true,
          event: {
            type: event.type,
            id: event.id
          }
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (err) {
      console.error('Error processing webhook event:', {
        eventType: event.type,
        error: err.message,
        stack: err.stack,
        event: JSON.stringify(event, null, 2)
      });
      return new Response(
        JSON.stringify({ 
          error: 'Event processing failed', 
          code: 'processing_error',
          details: err.message,
          debug: {
            eventType: event.type,
            error: err.message,
            stack: err.stack
          }
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error processing webhook:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error', 
        code: 'internal_error',
        details: error.message,
        debug: {
          error: error.message,
          stack: error.stack,
          type: error.constructor.name
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
