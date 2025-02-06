
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
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
      apiVersion: '2023-10-16',
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
    const { priceId, promotionData } = await req.json();
    
    if (!priceId) {
      throw new Error('No price ID provided');
    }

    console.log('Creating payment session...');

    // Check if this is a promotion purchase by checking priceId against known promotion price IDs
    const isPromotion = [
      'price_1QpCdhFx6uwYcH3SqX5B02x3',  // Silver
      'price_1QpCecFx6uwYcH3S7TqiqXmo',  // Gold
      'price_1QpCf7Fx6uwYcH3SClLj92Pf'   // Platinum
    ].includes(priceId);

    // Set up session parameters based on payment type
    const sessionParams = {
      customer: customer_id,
      customer_email: customer_id ? undefined : email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isPromotion ? 'payment' : 'subscription',
      success_url: `${req.headers.get('origin')}/spotify-playlist-promotion/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/spotify-playlist-promotion`,
    };

    // If this is a promotion purchase, add metadata
    if (isPromotion && promotionData) {
      const { trackName, trackArtist, spotifyTrackId, spotifyArtistId, submissionCount, estimatedAdditions, genre } = promotionData;
      
      // Add metadata to the session
      sessionParams.metadata = {
        type: 'promotion',
        trackName,
        trackArtist,
        spotifyTrackId,
        spotifyArtistId,
        submissionCount: submissionCount.toString(),
        estimatedAdditions: estimatedAdditions.toString(),
        genre,
        userId: user.id
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Payment session created:', session.id);
    return new Response(
      JSON.stringify({ session_url: session.url }),
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
