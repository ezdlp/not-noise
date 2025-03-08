import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 3
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      })
    }

    // Verify Stripe webhook signature
    const signature = req.headers.get('stripe-signature') || ''
    const body = await req.text()
    
    console.log(`⏳ Verifying webhook signature for event...`)
    
    let event
    try {
      // With the 2025-02-24.acacia API version, we need to ensure proper signature verification
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ Webhook signature verified: ${event.id} - Type: ${event.type}`)
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`)
      console.error(`⚠️ Headers received: ${JSON.stringify(Object.fromEntries(req.headers))}`)
      console.error(`⚠️ Signature received: ${signature.substring(0, 20)}...`)
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client with service role key (needed for admin access)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log(`✅ Received event: ${event.type} (ID: ${event.id})`)
    
    // Handle different event types
    try {
      // Extract user ID for subscription events
      let userId = null
      let checkoutSession = null
      
      if (event.type === 'checkout.session.completed') {
        // Extract userId from metadata in checkout session events
        checkoutSession = event.data.object
        userId = checkoutSession.metadata?.userId || null
        const eventType = checkoutSession.metadata?.type || null
        
        console.log(`📝 Checkout completed for user ${userId || 'unknown'}, type: ${eventType || 'unknown'}`)
        
        // If this is a subscription checkout, handle it
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription
          
          // Fetch the subscription to get its details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          if (userId) {
            // Update the user's subscription in our database
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                tier: 'pro', // Set to pro tier for paid subscriptions
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                billing_period: subscription.items.data[0]?.plan.interval || 'monthly',
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })
              
            if (subscriptionError) {
              console.error(`❌ Error updating subscription for user ${userId}: ${subscriptionError.message}`)
              throw subscriptionError
            }
            
            console.log(`✅ Successfully updated subscription status for user ${userId}`)
          } else {
            console.error(`⚠️ No user ID found in checkout.session.completed metadata`)
          }
        } else if (checkoutSession.mode === 'payment' && checkoutSession.metadata?.type === 'promotion') {
          // Handle promotion payments (one-time payments)
          console.log(`💰 Processing promotion payment for user ${userId || 'unknown'}`)
          
          // Check if we need to create a promotion record
          if (userId && checkoutSession.payment_status === 'paid') {
            const { trackName, trackArtist, spotifyTrackId, spotifyArtistId, submissionCount, estimatedAdditions, genre } = checkoutSession.metadata
            
            // Create promotion record
            const { error: promotionError } = await supabase
              .from('promotions')
              .insert({
                user_id: userId,
                track_name: trackName,
                track_artist: trackArtist,
                spotify_track_id: spotifyTrackId,
                spotify_artist_id: spotifyArtistId,
                submission_count: parseInt(submissionCount || '0'),
                estimated_additions: parseInt(estimatedAdditions || '0'),
                genre: genre || 'other',
                total_cost: checkoutSession.amount_total / 100, // Convert from cents to dollars
                status: 'pending'
              })
              
            if (promotionError) {
              console.error(`❌ Error creating promotion record: ${promotionError.message}`)
              throw promotionError
            }
            
            console.log(`✅ Successfully created promotion record for track "${trackName}"`)
          }
        }
      }
      
      // Customer events
      if (event.type.startsWith('customer.')) {
        const customer = event.data.object
        if (event.type === 'customer.deleted') {
          await supabase
            .from('custom_stripe_customers')
            .delete()
            .eq('id', customer.id)
            
          console.log(`🗑️ Deleted customer record: ${customer.id}`)
        } else {
          await supabase
            .from('custom_stripe_customers')
            .upsert({
              id: customer.id,
              email: customer.email,
              name: customer.name,
              description: customer.description,
              created: customer.created,
              metadata: customer.metadata,
              last_updated: new Date().toISOString()
            }, { onConflict: 'id' })
            
          console.log(`✅ Updated customer record: ${customer.id}`)
        }
      }
        
      // Subscription events
      if (event.type.startsWith('customer.subscription.')) {
        const subscription = event.data.object
        
        // Try to find the user ID from the subscription table if not already set
        if (!userId) {
          const { data: customerData } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()
            
          userId = customerData?.user_id
          console.log(`🔍 Found user ID ${userId || 'unknown'} for subscription ${subscription.id}`)
        }
        
        if (event.type === 'customer.subscription.deleted') {
          // Don't actually delete the record, just mark it as canceled
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
              tier: 'free' // Downgrade to free tier when subscription is canceled
            })
            .eq('stripe_subscription_id', subscription.id)
            
          console.log(`✅ Marked subscription ${subscription.id} as canceled`)
        } else {
          // For created or updated subscriptions
          const tier = subscription.status === 'active' ? 'pro' : 'free'
          
          const subscriptionData = {
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            tier: tier,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            billing_period: subscription.items.data[0]?.plan.interval || 'monthly',
            updated_at: new Date().toISOString()
          }
          
          // If we have a user ID, use it for the upsert
          if (userId) {
            subscriptionData.user_id = userId
            await supabase
              .from('subscriptions')
              .upsert(subscriptionData, { onConflict: 'user_id' })
              
            console.log(`✅ Updated subscription ${subscription.id} with status ${subscription.status} for user ${userId}`)
          } else {
            // Otherwise try to update by stripe_subscription_id
            await supabase
              .from('subscriptions')
              .update(subscriptionData)
              .eq('stripe_subscription_id', subscription.id)
              
            console.log(`✅ Updated subscription ${subscription.id} with status ${subscription.status}`)
          }
        }
      }
        
      // Product events
      if (event.type.startsWith('product.')) {
        const product = event.data.object
        if (event.type === 'product.deleted') {
          await supabase
            .from('custom_stripe_products')
            .delete()
            .eq('id', product.id)
        } else {
          await supabase
            .from('custom_stripe_products')
            .upsert({
              id: product.id,
              name: product.name,
              active: product.active,
              description: product.description,
              last_updated: new Date().toISOString()
            }, { onConflict: 'id' })
        }
      }
        
      // Price events
      if (event.type.startsWith('price.')) {
        const price = event.data.object
        if (event.type === 'price.deleted') {
          await supabase
            .from('custom_stripe_prices')
            .delete()
            .eq('id', price.id)
        } else {
          await supabase
            .from('custom_stripe_prices')
            .upsert({
              id: price.id,
              product: price.product,
              active: price.active,
              currency: price.currency,
              unit_amount: price.unit_amount,
              type: price.type,
              recurring: price.recurring,
              metadata: price.metadata,
              last_updated: new Date().toISOString()
            }, { onConflict: 'id' })
        }
      }
        
      // Invoice events
      if (event.type.startsWith('invoice.')) {
        const invoice = event.data.object
        if (event.type === 'invoice.deleted') {
          await supabase
            .from('custom_stripe_invoices')
            .delete()
            .eq('id', invoice.id)
        } else {
          await supabase
            .from('custom_stripe_invoices')
            .upsert({
              id: invoice.id,
              customer: invoice.customer,
              subscription: invoice.subscription,
              status: invoice.status,
              total: invoice.total,
              currency: invoice.currency,
              period_start: invoice.period_start,
              period_end: invoice.period_end,
              lines: invoice.lines.data,
              last_updated: new Date().toISOString()
            }, { onConflict: 'id' })
        }
      }
        
      // Charge events
      if (event.type.startsWith('charge.')) {
        const charge = event.data.object
        await supabase
          .from('custom_stripe_charges')
          .upsert({
            id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            customer: charge.customer,
            description: charge.description,
            invoice: charge.invoice,
            payment_intent: charge.payment_intent,
            status: charge.status,
            created: new Date(charge.created * 1000).toISOString(),
            attrs: charge.metadata || {},
            last_updated: new Date().toISOString()
          }, { onConflict: 'id' })
      }
    } catch (error) {
      console.error(`❌ Error processing event ${event.type}: ${error.message}`)
      console.error(error.stack)
      return new Response(JSON.stringify({ error: `Error processing event: ${error.message}` }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ received: true, event_id: event.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`❌ Unhandled error processing webhook: ${error.message}`)
    console.error(error.stack)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
