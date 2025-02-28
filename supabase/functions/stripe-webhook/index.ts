
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Import the CORS headers from shared module
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('No stripe signature found in request headers')
      await notifyAdminOfError('Stripe webhook error: No signature found in headers')
      return new Response(
        JSON.stringify({ error: 'No stripe signature found in request headers' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const body = await req.text()
    
    if (!body) {
      console.error('No request body found')
      await notifyAdminOfError('Stripe webhook error: No request body found')
      return new Response(
        JSON.stringify({ error: 'No request body found' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let event

    try {
      // Important: Use constructEventAsync (async) instead of constructEvent (sync)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log(`✅ Success: Verified webhook signature | ${event.id}`)
    } catch (err) {
      console.error(`❌ Error verifying webhook signature: ${err.message}`)
      await notifyAdminOfError(`Stripe webhook signature verification failed: ${err.message}`)
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Webhook event type: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object
        
        // If checkout session is for a subscription
        if (checkoutSession.mode === 'subscription') {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription)
          
          console.log(`✓ Subscription ${subscription.id} for customer ${subscription.customer} is ${subscription.status}`)
          
          // Update the user's subscription status in your database
          // This will depend on your specific database structure
          
          // Call your database update function here
        }
        // If checkout session is for a one-time payment
        else if (checkoutSession.mode === 'payment') {
          console.log(`✓ One-time payment for customer ${checkoutSession.customer} completed`)
          
          // Process the payment completion
          
          // Call your payment processing function here
        }
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object
        console.log(`✓ Subscription ${subscription.id} status is ${subscription.status}`)
        
        // Update subscription status
        
        // Call your subscription update function here
        break
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object
        console.log(`✓ Invoice payment succeeded for ${invoice.customer}`)
        
        // Process successful payment
        
        // Call your invoice processing function here
        break
      
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object
        console.log(`✗ Invoice payment failed for ${failedInvoice.customer}`)
        
        // Handle failed payment
        
        // Call your failed payment function here
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return a response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(`❌ Error processing webhook: ${err.message}`)
    await notifyAdminOfError(`Stripe webhook processing error: ${err.message}`)
    return new Response(
      JSON.stringify({ error: `Webhook processing failed: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to notify admin of webhook errors
async function notifyAdminOfError(errorMessage: string): Promise<void> {
  try {
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, cannot send notification')
      return
    }

    // Call the send-notification function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: 'Stripe Webhook Error Alert',
          message: `There was an error with the Stripe webhook:\n\n${errorMessage}\n\nPlease check your Supabase logs for more details.`,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`Failed to send error notification: ${errorData}`)
    }
  } catch (err) {
    console.error(`Error sending notification: ${err.message}`)
  }
}
