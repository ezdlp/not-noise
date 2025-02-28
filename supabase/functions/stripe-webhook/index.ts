
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// For notification on webhook failures
const sendAlertEmail = async (errorMessage: string) => {
  try {
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!adminEmail) {
      console.error("No admin email configured for alerts");
      return;
    }
    
    // Simple implementation using a notification service
    // This could be expanded to use a dedicated service like SendGrid, Postmark, etc.
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        to: adminEmail,
        subject: "ALERT: Stripe Webhook Failure",
        message: `The Stripe webhook encountered an error: ${errorMessage}`,
      }),
    });
    
    if (!response.ok) {
      console.error("Failed to send alert notification", await response.text());
    }
  } catch (error) {
    console.error("Error sending alert notification:", error);
  }
};

// Log webhook activity with detailed information
const logWebhookActivity = async (status: string, eventType: string, details: any) => {
  try {
    const { data, error } = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/webhook_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status,
        event_type: eventType,
        details: JSON.stringify(details),
        created_at: new Date().toISOString(),
      }),
    }).then(res => res.json());

    if (error) {
      console.error("Failed to log webhook activity:", error);
    }
  } catch (error) {
    console.error("Error logging webhook activity:", error);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only allow POST requests for actual webhook events
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let event;
  try {
    // Get stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      const errorMsg = "Missing stripe-signature header";
      console.error(errorMsg);
      await logWebhookActivity('error', 'unknown', { error: errorMsg });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      const errorMsg = "Missing STRIPE_WEBHOOK_SECRET environment variable";
      console.error(errorMsg);
      await sendAlertEmail(errorMsg);
      await logWebhookActivity('error', 'unknown', { error: errorMsg });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the raw request body
    const body = await req.text();
    
    // Initialize Stripe with the API key
    const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
    
    // Use the async version of constructEvent as required by Deno
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Log the received event
    console.log(`Received stripe webhook: ${event.type}`);
    await logWebhookActivity('success', event.type, { 
      id: event.id,
      api_version: event.api_version,
      created: event.created
    });

    // Handle specific webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Handle the checkout session completion
        console.log(`Processing checkout session: ${session.id}`);
        
        if (session.mode === 'subscription') {
          // Process subscription purchase
          console.log(`New subscription: ${session.subscription}`);
          
          // Get customer details
          const customerDetails = session.customer_details;
          const customerEmail = customerDetails?.email;
          
          if (customerEmail) {
            // Update user subscription status in the database
            // This is a simplified example - actual implementation would depend on your database schema
            const customerId = session.customer;
            const subscriptionId = session.subscription;
            
            // Call another function to update the user subscription status
            const updateResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/update-user-subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                email: customerEmail,
                customerId,
                subscriptionId,
                status: 'active',
                plan: session.metadata?.plan || 'default',
              }),
            });
            
            if (!updateResponse.ok) {
              const errorMsg = `Failed to update user subscription: ${await updateResponse.text()}`;
              console.error(errorMsg);
              await sendAlertEmail(errorMsg);
              await logWebhookActivity('error', event.type, { error: errorMsg, session_id: session.id });
            }
          }
        } else if (session.mode === 'payment') {
          // Process one-time payment
          console.log(`One-time payment: ${session.payment_intent}`);
          
          // Similar logic for one-time payments
          // ...
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Handle subscription updates (upgrades, downgrades, etc.)
        const customerId = subscription.customer;
        const status = subscription.status;
        
        // Call function to update the subscription status
        const updateResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/update-subscription-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            customerId,
            subscriptionId: subscription.id,
            status,
            currentPeriodEnd: subscription.current_period_end,
          }),
        });
        
        if (!updateResponse.ok) {
          const errorMsg = `Failed to update subscription status: ${await updateResponse.text()}`;
          console.error(errorMsg);
          await sendAlertEmail(errorMsg);
          await logWebhookActivity('error', event.type, { error: errorMsg, subscription_id: subscription.id });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Subscription canceled: ${subscription.id}`);
        
        // Handle subscription cancellation
        // Similar logic as above
        // ...
        break;
      }
      
      // Add other event types as needed
      
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    // Detailed error handling
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Webhook error: ${errorMessage}`);
    
    // Alert administrators about the error
    await sendAlertEmail(errorMessage);
    
    // Log the error for debugging
    await logWebhookActivity('error', event?.type || 'unknown', { 
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    });

    return new Response(JSON.stringify({ error: `Webhook error: ${errorMessage}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
