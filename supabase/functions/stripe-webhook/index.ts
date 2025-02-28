
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.16.0?target=deno';

// Define CORS headers - critical for allowing webhook requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

console.log("Stripe webhook function loaded");

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Handle CORS preflight requests - critical for webhook reception
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the raw request body for signature verification
    const body = await req.text();
    console.log(`Received webhook body of length: ${body.length}`);
    
    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No Stripe signature found in headers');
      return new Response(JSON.stringify({ error: 'No Stripe signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify the event using the signature and secret
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook verified: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Processing checkout.session.completed for session ID: ${session.id}`);
        
        // Extract relevant data
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type;
        
        console.log(`Session details: customerId=${customerId}, subscriptionId=${subscriptionId}, userId=${userId}, type=${type}`);
        
        if (!userId) {
          console.error('No userId in session metadata');
          return new Response(JSON.stringify({ error: 'Missing userId in metadata' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Process subscription
        if (type === 'subscription' && subscriptionId) {
          try {
            console.log(`Retrieving subscription details for ID: ${subscriptionId}`);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            if (!subscription) {
              console.error(`No subscription found for ID: ${subscriptionId}`);
              return new Response(JSON.stringify({ error: 'Subscription not found' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            
            // Get the priceId from subscription
            const priceId = subscription.items.data[0]?.price.id;
            console.log(`Subscription price ID: ${priceId}`);
            
            if (!priceId) {
              console.error('No price ID found in subscription');
              return new Response(JSON.stringify({ error: 'No price ID found in subscription' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            // Determine subscription tier based on priceId
            let tier = 'free';
            if (priceId === 'price_1Qs5ALFx6uwYcH3S96XYib6f' || priceId === 'price_1QsQGrFx6uwYcH3SCT6RJsSI') {
              tier = 'pro';
            }
            console.log(`Determined tier: ${tier} based on priceId: ${priceId}`);

            // Create or update subscription in database
            const supabaseAdminUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
            
            if (!supabaseAdminUrl || !supabaseServiceKey) {
              console.error('Missing Supabase admin credentials');
              return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            const adminHeaders = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            };

            // Check if subscription exists
            const checkUrl = `${supabaseAdminUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=id`;
            console.log(`Checking for existing subscription: ${checkUrl}`);
            const checkResponse = await fetch(checkUrl, {
              method: 'GET',
              headers: adminHeaders
            });
            
            const existingSubscriptions = await checkResponse.json();
            const subscriptionExists = existingSubscriptions && existingSubscriptions.length > 0;
            console.log(`Subscription exists: ${subscriptionExists}`);

            // Prepare subscription data
            const subscriptionData = {
              user_id: userId,
              customer_id: customerId,
              subscription_id: subscriptionId,
              price_id: priceId,
              tier: tier,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end
            };

            let dbResponse;
            if (subscriptionExists) {
              // Update existing subscription
              const updateUrl = `${supabaseAdminUrl}/rest/v1/subscriptions?user_id=eq.${userId}`;
              console.log(`Updating subscription: ${updateUrl}`);
              dbResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: adminHeaders,
                body: JSON.stringify(subscriptionData)
              });
            } else {
              // Create new subscription
              const createUrl = `${supabaseAdminUrl}/rest/v1/subscriptions`;
              console.log(`Creating subscription: ${createUrl}`);
              dbResponse = await fetch(createUrl, {
                method: 'POST',
                headers: adminHeaders,
                body: JSON.stringify(subscriptionData)
              });
            }

            if (!dbResponse.ok) {
              const errorText = await dbResponse.text();
              console.error(`Database operation failed: ${dbResponse.status} ${dbResponse.statusText}, Error: ${errorText}`);
              return new Response(JSON.stringify({ error: `Database operation failed: ${errorText}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            console.log(`Subscription successfully ${subscriptionExists ? 'updated' : 'created'} for user ${userId}`);
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } catch (err) {
            console.error(`Error processing subscription: ${err.message}`);
            return new Response(JSON.stringify({ error: `Error processing subscription: ${err.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        
        // Handle promotion payments if needed
        if (type === 'promotion') {
          // Implementation for handling promotion payments would go here
          console.log(`Processed promotion payment for user: ${userId}`);
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Processing customer.subscription.updated for subscription ID: ${subscription.id}`);
        
        // Extract customer ID to find the user
        const customerId = subscription.customer as string;
        
        // Get Supabase admin credentials
        const supabaseAdminUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        if (!supabaseAdminUrl || !supabaseServiceKey) {
          console.error('Missing Supabase admin credentials');
          return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Find the user subscription
        const adminHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        };
        
        const findUrl = `${supabaseAdminUrl}/rest/v1/subscriptions?customer_id=eq.${customerId}&select=*`;
        console.log(`Finding subscription: ${findUrl}`);
        const findResponse = await fetch(findUrl, {
          method: 'GET',
          headers: adminHeaders
        });
        
        const subscriptions = await findResponse.json();
        if (!subscriptions || subscriptions.length === 0) {
          console.error(`No subscription found for customer ID: ${customerId}`);
          return new Response(JSON.stringify({ error: 'Subscription not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const userSubscription = subscriptions[0];
        console.log(`Found subscription for user ID: ${userSubscription.user_id}`);
        
        // Update the subscription
        const updateData = {
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        };
        
        const updateUrl = `${supabaseAdminUrl}/rest/v1/subscriptions?id=eq.${userSubscription.id}`;
        console.log(`Updating subscription: ${updateUrl}`);
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: adminHeaders,
          body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`Failed to update subscription: ${updateResponse.status} ${updateResponse.statusText}, Error: ${errorText}`);
          return new Response(JSON.stringify({ error: `Failed to update subscription: ${errorText}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.log(`Subscription updated for user ID: ${userSubscription.user_id}`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Handle other event types if needed
      default: {
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ received: true, handled: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
