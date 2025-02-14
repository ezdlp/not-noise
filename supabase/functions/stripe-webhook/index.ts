
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate webhook secret
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET')
      throw new Error('Webhook secret is not configured')
    }

    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No stripe signature found in headers')
      throw new Error('No stripe signature found in request headers')
    }

    // Get the raw request body as a Uint8Array
    const rawBody = await req.arrayBuffer()
    const body = new TextDecoder().decode(rawBody)

    console.log('Processing webhook:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      bodyLength: body.length,
      signatureHeader: signature?.substring(0, 50) + '...',
      bodyPreview: body.substring(0, 100) + '...'
    })

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.LATEST_API_VERSION
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        type: err.type || 'unknown',
        bodyPreview: body.substring(0, 100) + '...'
      })
      return new Response(
        JSON.stringify({
          error: 'Webhook signature verification failed',
          details: err.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Webhook verified successfully:', {
      eventId: event.id,
      eventType: event.type
    })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.userId

        console.log('Processing checkout.session.completed:', {
          customerId,
          subscriptionId,
          userId,
          metadata: session.metadata
        })

        if (!userId) {
          throw new Error('No user ID found in session metadata')
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Determine tier based on price ID
        const priceId = subscription.items.data[0].price.id
        const tier = priceId.includes('month') ? 'pro_monthly' : 'pro_yearly'

        console.log('Updating subscription in database:', {
          userId,
          customerId,
          subscriptionId,
          tier
        })

        // Update or insert subscription in database
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            tier: 'pro',
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          })

        if (upsertError) {
          console.error('Error updating subscription in database:', upsertError)
          throw upsertError
        }

        console.log('Successfully processed checkout.session.completed')
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('Processing customer.subscription.updated:', {
          customerId,
          subscriptionId: subscription.id,
          status: subscription.status
        })

        // Find user_id from stripe_customer_id
        const { data: subscriptionData, error: fetchError } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError) {
          console.error('Error fetching user_id from subscriptions:', fetchError)
          throw fetchError
        }

        if (!subscriptionData?.user_id) {
          throw new Error(`No subscription found for customer: ${customerId}`)
        }

        // Update subscription in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          throw updateError
        }

        console.log('Successfully processed customer.subscription.updated')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('Processing customer.subscription.deleted:', {
          customerId,
          subscriptionId: subscription.id
        })

        // Update subscription status in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free'
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('Error updating subscription status:', updateError)
          throw updateError
        }

        console.log('Successfully processed customer.subscription.deleted')
        break
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response(
      JSON.stringify({
        error: 'Error processing webhook',
        details: err.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
