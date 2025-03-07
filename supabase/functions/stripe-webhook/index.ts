import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  try {
    // Verify Stripe webhook signature
    const signature = req.headers.get('stripe-signature') || ''
    const body = await req.text()
    
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log(`✅ Received event: ${event.type}`)
    
    // Handle different event types
    switch (event.type) {
      // Customer events
      case 'customer.created':
      case 'customer.updated':
      case 'customer.deleted':
        const customer = event.data.object
        if (event.type === 'customer.deleted') {
          await supabase
            .from('custom_stripe_customers')
            .delete()
            .eq('id', customer.id)
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
        }
        break
        
      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object
        if (event.type === 'customer.subscription.deleted') {
          await supabase
            .from('custom_stripe_subscriptions')
            .delete()
            .eq('id', subscription.id)
        } else {
          await supabase
            .from('custom_stripe_subscriptions')
            .upsert({
              id: subscription.id,
              customer: subscription.customer,
              status: subscription.status,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
              last_updated: new Date().toISOString()
            }, { onConflict: 'id' })
        }
        break
        
      // Product events
      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
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
        break
        
      // Price events
      case 'price.created':
      case 'price.updated':
      case 'price.deleted':
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
        break
        
      // Invoice events
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.deleted':
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
        break
        
      // Charge events
      case 'charge.succeeded':
      case 'charge.updated':
      case 'charge.refunded':
      case 'charge.captured':
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
        break
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`❌ Error processing webhook: ${error.message}`)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

