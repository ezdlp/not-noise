import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { handleSubscription } from './subscription-handler.js'

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

// Helper function to map Stripe interval to DB billing_period enum
function mapStripeToBillingPeriod(stripeInterval) {
  // Map Stripe's interval value to our database enum
  const intervalMap = {
    'month': 'monthly',
    'year': 'annual',
    // Add other mappings if needed
  }
  
  return intervalMap[stripeInterval] || 'monthly' // Default to monthly if unknown
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
      // IMPORTANT: Use constructEventAsync instead of constructEvent with API version 2025-02-24.acacia
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
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
        const promotionId = checkoutSession.metadata?.promotionId || null
        const isResumingPayment = checkoutSession.metadata?.isResumingPayment === 'true'
        
        console.log(`📝 Checkout completed for user ${userId || 'unknown'}, type: ${eventType || 'unknown'}`)
        
        // If this is a subscription checkout, handle it
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription
          
          // Fetch the subscription to get its details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          if (userId) {
            console.log(`🔍 Processing subscription ${subscriptionId} for user ${userId}`)
            
            // Get the subscription interval (month or year) from Stripe
            const stripeInterval = subscription.items.data[0]?.plan.interval || 'month'
            console.log(`📊 Stripe interval: ${stripeInterval}`)
            
            // Map it to our database enum values (monthly or annual)
            const billingPeriod = mapStripeToBillingPeriod(stripeInterval)
            console.log(`📊 Mapped to DB billing_period: ${billingPeriod}`)

            // First check if user already has this subscription in the database
            const { data: existingSubscription, error: checkError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', userId)
              .eq('stripe_subscription_id', subscriptionId)
              .single()
              
            if (checkError && checkError.code !== 'PGRST116') {
              console.error(`❌ Error checking existing subscription: ${checkError.message}`)
              // Continue anyway, as we'll try to upsert
            }
            
            if (existingSubscription) {
              console.log(`⚠️ User ${userId} already has subscription ${subscriptionId} in database. Will update it.`)
            }
            
            // Prepare subscription data
            const subscriptionData = {
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              tier: 'pro', // Set to pro tier for paid subscriptions
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              billing_period: billingPeriod, // Use mapped value instead of direct Stripe value
              updated_at: new Date().toISOString()
            }
            
            console.log(`🔄 Updating/inserting subscription data: ${JSON.stringify(subscriptionData)}`)
            
            // First try to update if record exists
            if (existingSubscription) {
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update(subscriptionData)
                .eq('user_id', userId)
                .eq('stripe_subscription_id', subscriptionId)
              
              if (updateError) {
                console.error(`❌ Error updating subscription: ${updateError.message}`)
                throw updateError
              } else {
                console.log(`✅ Successfully updated subscription ${subscriptionId} for user ${userId}`)
              }
            } else {
              // Insert new record
              const { error: insertError } = await supabase
                .from('subscriptions')
                .insert(subscriptionData)
              
              if (insertError) {
                console.error(`❌ Error inserting subscription: ${insertError.message}`)
                console.error(`❌ Error details: ${JSON.stringify(insertError)}`)
                throw insertError
              } else {
                console.log(`✅ Successfully inserted new subscription ${subscriptionId} for user ${userId}`)
              }
            }
          } else {
            console.error(`⚠️ No user ID found in checkout.session.completed metadata`)
          }
        } else if (checkoutSession.mode === 'payment' && checkoutSession.metadata?.type === 'promotion') {
          // Handle promotion payments (one-time payments)
          console.log(`💰 Processing promotion payment for user ${userId || 'unknown'}`);
          
          // Check if we need to create/update a promotion record
          if (userId && checkoutSession.payment_status === 'paid') {
            const { trackName, trackArtist, spotifyTrackId, spotifyArtistId, submissionCount, estimatedAdditions, genre, packageId } = checkoutSession.metadata;
            
            if (promotionId) {
              // Check if promotion already exists - this could be a payment resumption
              const { data: existingPromotion } = await supabase
                .from('promotions')
                .select('*')
                .eq('id', promotionId)
                .single();
                
              if (existingPromotion) {
                console.log('Updating existing promotion record:', promotionId);
                
                // Update the existing promotion record
                const { error: updateError } = await supabase
                  .from('promotions')
                  .update({
                    status: 'active',
                    updated_at: new Date().toISOString(),
                    start_date: new Date().toISOString(),
                    package_tier: packageId?.toLowerCase() || existingPromotion.package_tier || 'silver'
                  })
                  .eq('id', promotionId);
                  
                if (updateError) {
                  console.error(`❌ Error updating promotion record: ${updateError.message}`);
                } else {
                  console.log(`✅ Successfully updated promotion record for track "${trackName}"`);
                }
              } else {
                console.log('Promotion ID provided but record not found, creating new record');
                
                // Create promotion record
                const { error: promotionError } = await supabase
                  .from('promotions')
                  .insert({
                    id: promotionId, // Use the existing ID
                    user_id: userId,
                    track_name: trackName,
                    track_artist: trackArtist,
                    spotify_track_id: spotifyTrackId,
                    spotify_artist_id: spotifyArtistId,
                    submission_count: parseInt(submissionCount || '0'),
                    estimated_additions: parseInt(estimatedAdditions || '0'),
                    genre: genre || 'other',
                    package_tier: packageId?.toLowerCase() || 'silver',
                    total_cost: checkoutSession.amount_total / 100, // Convert from cents to dollars
                    status: 'active',
                    start_date: new Date().toISOString()
                  });
                  
                if (promotionError) {
                  console.error(`❌ Error creating promotion record: ${promotionError.message}`);
                } else {
                  console.log(`✅ Successfully created promotion record for track "${trackName}"`);
                }
              }
            } else {
              // No promotion ID provided, create a new record (fallback case)
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
                  package_tier: packageId?.toLowerCase() || 'silver',
                  total_cost: checkoutSession.amount_total / 100, // Convert from cents to dollars
                  status: 'active',
                  start_date: new Date().toISOString()
                });
                
              if (promotionError) {
                console.error(`❌ Error creating promotion record: ${promotionError.message}`);
              } else {
                console.log(`✅ Successfully created promotion record for track "${trackName}"`);
              }
            }
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
        await handleSubscription(supabase, subscription, event.type)
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
