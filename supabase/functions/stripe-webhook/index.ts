
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Utility function to log webhook events with structured data
const logWebhookEvent = (eventType: string, data: any, status: 'success' | 'error' = 'success') => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'webhook_event',
    event_type: eventType,
    status,
    data
  }));
}

// Utility function to verify subscription data against FDW tables
async function verifySubscriptionData(subscriptionId: string, customerId: string) {
  try {
    const { data: stripeSubData, error: subError } = await supabaseClient
      .from('stripe_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError) {
      throw new Error(`Failed to verify subscription in FDW: ${subError.message}`);
    }

    const { data: stripeCustomerData, error: custError } = await supabaseClient
      .from('stripe_customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (custError) {
      throw new Error(`Failed to verify customer in FDW: ${custError.message}`);
    }

    return {
      verified: true,
      subscription: stripeSubData,
      customer: stripeCustomerData
    };
  } catch (err) {
    console.error('Verification error:', err);
    return {
      verified: false,
      error: err.message
    };
  }
}

// Utility function to determine subscription tier from price ID
async function determineTierFromPrice(priceId: string): Promise<'free' | 'pro'> {
  try {
    const { data: priceData, error } = await supabaseClient
      .from('stripe_prices')
      .select('product, attrs')
      .eq('id', priceId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }

    // Default to 'pro' tier for now, but we could make this more sophisticated
    // based on product metadata if needed
    return 'pro';
  } catch (err) {
    console.error('Error determining tier:', err);
    return 'free';
  }
}

// Utility function to update subscription with retry logic
async function updateSubscriptionWithRetry(
  userId: string,
  customerId: string,
  subscriptionId: string,
  tier: 'free' | 'pro',
  status: string,
  currentPeriodEnd: string,
  cancelAtPeriodEnd: boolean,
  retries = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const { error: upsertError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          tier,
          status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd
        });

      if (upsertError) {
        throw upsertError;
      }
      
      logWebhookEvent('subscription_update', {
        userId,
        customerId,
        subscriptionId,
        tier,
        status
      });
      
      return;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate webhook secret
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      throw new Error('Webhook secret is not configured');
    }

    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe signature found in headers');
      throw new Error('No stripe signature found in request headers');
    }

    // Get the raw request body
    const rawBody = await req.arrayBuffer();
    const body = new TextDecoder().decode(rawBody);

    logWebhookEvent('received', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      bodyLength: body.length,
      signatureHeader: signature?.substring(0, 50) + '...'
    });

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.LATEST_API_VERSION
      );
    } catch (err) {
      logWebhookEvent('signature_verification_failed', {
        error: err.message,
        type: err.type || 'unknown'
      }, 'error');

      return new Response(
        JSON.stringify({
          error: 'Webhook signature verification failed',
          details: err.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logWebhookEvent('verified', {
      eventId: event.id,
      eventType: event.type
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;

        logWebhookEvent('processing_checkout_completed', {
          customerId,
          subscriptionId,
          userId,
          metadata: session.metadata
        });

        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }

        // Verify subscription data against FDW
        const verificationResult = await verifySubscriptionData(subscriptionId, customerId);
        if (!verificationResult.verified) {
          throw new Error(`Subscription verification failed: ${verificationResult.error}`);
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        
        // Determine tier based on price data from FDW
        const tier = await determineTierFromPrice(priceId);

        // Update subscription with retry logic
        await updateSubscriptionWithRetry(
          userId,
          customerId,
          subscriptionId,
          tier,
          subscription.status,
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.cancel_at_period_end
        );

        logWebhookEvent('checkout_completed_processed', {
          userId,
          customerId,
          subscriptionId,
          tier
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        logWebhookEvent('processing_subscription_updated', {
          customerId,
          subscriptionId: subscription.id,
          status: subscription.status
        });

        // Find user_id from stripe_customer_id
        const { data: subscriptionData, error: fetchError } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (fetchError) {
          throw new Error(`Error fetching user_id: ${fetchError.message}`);
        }

        if (!subscriptionData?.user_id) {
          throw new Error(`No subscription found for customer: ${customerId}`);
        }

        // Verify subscription data
        const verificationResult = await verifySubscriptionData(subscription.id, customerId);
        if (!verificationResult.verified) {
          throw new Error(`Subscription verification failed: ${verificationResult.error}`);
        }

        // Determine tier based on price data
        const priceId = subscription.items.data[0].price.id;
        const tier = await determineTierFromPrice(priceId);

        // Update subscription with retry logic
        await updateSubscriptionWithRetry(
          subscriptionData.user_id,
          customerId,
          subscription.id,
          tier,
          subscription.status,
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.cancel_at_period_end
        );

        logWebhookEvent('subscription_updated_processed', {
          userId: subscriptionData.user_id,
          customerId,
          subscriptionId: subscription.id,
          tier
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        logWebhookEvent('processing_subscription_deleted', {
          customerId,
          subscriptionId: subscription.id
        });

        // Update subscription status with retry logic
        const { data: subData, error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free'
          })
          .eq('stripe_customer_id', customerId)
          .select('user_id')
          .single();

        if (updateError) {
          throw new Error(`Error updating subscription status: ${updateError.message}`);
        }

        logWebhookEvent('subscription_deleted_processed', {
          userId: subData?.user_id,
          customerId,
          subscriptionId: subscription.id
        });
        break;
      }

      default: {
        logWebhookEvent('unhandled_event', {
          type: event.type
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    logWebhookEvent('error_processing_webhook', {
      error: err.message,
      stack: err.stack
    }, 'error');

    return new Response(
      JSON.stringify({
        error: 'Error processing webhook',
        details: err.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
