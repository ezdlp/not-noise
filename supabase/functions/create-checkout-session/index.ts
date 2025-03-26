
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('Authentication error:', authError);
      throw new Error('Authentication failed: ' + (authError?.message || 'User not found'));
    }
    
    const user = data.user;
    const email = user?.email;

    if (!email) {
      throw new Error('No email found for authenticated user');
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
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request body:', jsonError);
      throw new Error('Invalid request format');
    }
    
    // Route the request based on what's sent - either for regular checkout or promotion checkout
    let isPromotion = false;
    
    // Check if this is a promotion checkout request from PricingPlan.tsx
    if (requestData.packageId) {
      isPromotion = true;
      const { 
        packageId, 
        trackId, 
        trackName, 
        artistName, 
        genre, 
        basePrice, 
        discountApplied 
      } = requestData;

      // Validate required parameters
      if (!packageId || !trackId || !trackName || !artistName || !basePrice) {
        throw new Error('Missing required parameters for promotion checkout');
      }

      console.log('Creating promotion checkout session...', { 
        packageId,
        trackId,
        trackName,
        artistName,
        genre,
        basePrice,
        discountApplied,
        userId: user.id,
        email 
      });

      // Calculate final price with discount if applicable
      const finalPrice = discountApplied ? Math.round(basePrice * 0.9 * 100) : Math.round(basePrice * 100);

      // Get package tier name for display
      let tierName;
      let submissionCount, estimatedAdditions;
      
      switch (packageId.toLowerCase()) {
        case 'silver':
          tierName = 'Silver';
          submissionCount = 20;
          estimatedAdditions = 5;
          break;
        case 'gold':
          tierName = 'Gold';
          submissionCount = 35;
          estimatedAdditions = 8;
          break;
        case 'platinum':
          tierName = 'Platinum';
          submissionCount = 50;
          estimatedAdditions = 12;
          break;
        default:
          tierName = 'Silver';
          submissionCount = 20;
          estimatedAdditions = 5;
      }

      // Create a record in the promotions table
      const { data: promotion, error: promotionError } = await supabaseClient
        .from('promotions')
        .insert({
          user_id: user.id,
          spotify_track_id: trackId,
          track_name: trackName,
          track_artist: artistName,
          spotify_artist_id: trackId.split(':')[2] || '', // Extract artist ID from track ID
          genre: genre || 'other',
          total_cost: finalPrice / 100, // Store price in dollars
          status: 'pending', // Use 'pending' as it's one of the allowed values
          created_at: new Date().toISOString(),
          submission_count: submissionCount,
          estimated_additions: estimatedAdditions,
          success_rate: 0, // Initialize at 0
          initial_streams: 0, // Optional but good to initialize
          final_streams: null // Optional
        })
        .select('id')
        .single();

      if (promotionError) {
        console.error('Error creating promotion:', promotionError);
        throw new Error('Failed to create promotion record: ' + promotionError.message);
      }

      // Create Stripe checkout session
      try {
        const session = await stripe.checkout.sessions.create({
          customer: customer_id,
          customer_email: customer_id ? undefined : email,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${tierName} Promotion Package`,
                  description: `Spotify playlist promotion for "${trackName}" by ${artistName}`,
                  metadata: {
                    promotionId: promotion.id,
                    trackId,
                    packageId,
                  },
                },
                unit_amount: finalPrice,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.headers.get('origin')}/spotify-playlist-promotion/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.get('origin')}/spotify-playlist-promotion?canceled=true`,
          metadata: {
            promotionId: promotion.id,
            userId: user.id,
            type: 'promotion',
            trackName,
            trackArtist: artistName,
            spotifyTrackId: trackId,
            spotifyArtistId: trackId.split(':')[2] || '',
            submissionCount: submissionCount.toString(),
            estimatedAdditions: estimatedAdditions.toString(),
            genre: genre || 'other',
            packageId,
            isProDiscount: discountApplied ? 'true' : 'false'
          },
          client_reference_id: promotion.id,
        });

        // Return the checkout URL
        return new Response(
          JSON.stringify({
            checkoutUrl: session.url,
            promotionId: promotion.id,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (stripeError) {
        console.error('Stripe checkout session creation error:', stripeError);
        throw new Error(`Stripe error: ${stripeError.message}`);
      }
    } else {
      // Handle regular subscription checkout flow
      const { priceId, promotionData, isSubscription } = requestData;
      
      if (!priceId) {
        throw new Error('No price ID provided');
      }

      console.log('Creating payment session...', { 
        priceId, 
        isSubscription,
        userId: user.id,
        email 
      });

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
        success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/pricing`,
        metadata: {
          userId: user.id,
          type: isSubscription ? 'subscription' : 'payment'
        },
        expand: ['subscription']
      };

      // If this is a promotion purchase with promotionData, add promotion metadata
      if (promotionData) {
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

      try {
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
      } catch (stripeError) {
        console.error('Stripe checkout session creation error:', stripeError);
        throw new Error(`Stripe error: ${stripeError.message}`);
      }
    }
  } catch (error) {
    console.error('Error creating payment session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
