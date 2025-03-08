
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'; // Keep consistent version with webhook
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  try {
    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    const email = user?.email;

    if (!email) {
      throw new Error('No email found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-02-24.acacia', // Updated to match the Stripe dashboard version
      httpClient: Stripe.createFetchHttpClient(), // Explicitly set HTTP client for Deno environment
      maxNetworkRetries: 3, // Add retries for better reliability
    });

    // Get or create customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customer_id = undefined;
    if (customers.data.length > 0) {
      customer_id = customers.data[0].id;
    }

    // Get the request body
    const { priceId, promotionData, isSubscription } = await req.json();
    
    if (!priceId) {
      throw new Error('No price ID provided');
    }

    console.log('Creating payment session...', { 
      priceId, 
      isSubscription,
      userId: user.id,
      email 
    });

    // Check if this is a promotion by checking priceId against known promotion price IDs
    const promotionPriceIds = [
      'price_1QpCdhFx6uwYcH3SqX5B02x3',  // Silver
      'price_1QpCecFx6uwYcH3S7TqiqXmo',  // Gold
      'price_1QpCf7Fx6uwYcH3SClLj92Pf'   // Platinum
    ];

    const isPromotion = promotionPriceIds.includes(priceId);

    // Set up base session parameters
    const sessionParams = {
      customer: customer_id,
      customer_email: customer_id ? undefined : email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: isPromotion 
        ? `${req.headers.get('origin')}/spotify-playlist-promotion/success?session_id={CHECKOUT_SESSION_ID}`
        : `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isPromotion 
        ? `${req.headers.get('origin')}/spotify-playlist-promotion`
        : `${req.headers.get('origin')}/pricing`,
      metadata: {
        userId: user.id,
        type: isSubscription ? 'subscription' : 'promotion'
      },
      expand: ['subscription']
    };

    // If this is a promotion purchase, add promotion metadata
    if (isPromotion && promotionData) {
      const { trackName, trackArtist, spotifyTrackId, spotifyArtistId, submissionCount, estimatedAdditions, genre } = promotionData;
      
      // Add promotion specific metadata
      sessionParams.metadata = {
        ...sessionParams.metadata,
        trackName,
        trackArtist,
        spotifyTrackId,
        spotifyArtistId,
        submissionCount: submissionCount.toString(),
        estimatedAdditions: estimatedAdditions.toString(),
        genre
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Payment session created:', {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription?.id,
      metadata: session.metadata
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
