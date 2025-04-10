
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@15.7.0';
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

  // Initialize Supabase clients
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  try {
    // Debug log - Check environment variables
    console.log('Checking environment variables availability:');
    console.log('SUPABASE_URL exists:', Boolean(Deno.env.get('SUPABASE_URL')));
    console.log('SUPABASE_ANON_KEY exists:', Boolean(Deno.env.get('SUPABASE_ANON_KEY')));
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')));
    console.log('STRIPE_SECRET_KEY exists:', Boolean(Deno.env.get('STRIPE_SECRET_KEY')));
    
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

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      throw new Error('Server configuration error: Missing Stripe credentials');
    }
    
    console.log(`Initializing Stripe with API version 2025-02-24.acacia`);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia', // Using the version from your dashboard
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 3,
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
      console.log("Request data received:", JSON.stringify(requestData, null, 2));
    } catch (jsonError) {
      console.error('Error parsing request body:', jsonError);
      throw new Error('Invalid request format');
    }
    
    // Handle promotion checkout request
    let isPromotion = false;
    if (requestData.packageId) {
      isPromotion = true;
      const { 
        packageId, 
        trackId, 
        trackName, 
        artistName, 
        genre, 
        basePrice, 
        discountApplied,
        promotionId,
        isResumingPayment,
        artistId
      } = requestData;

      // Validate required parameters
      if (!packageId || !trackId) {
        console.error('Missing required parameters:', { packageId, trackId, trackName, artistName });
        throw new Error('Missing required parameters: packageId and trackId are required');
      }
      
      if (!trackName || !artistName) {
        console.error('Missing track details:', { trackName, artistName });
        throw new Error('Missing track details: trackName and artistName are required');
      }
      
      if (basePrice === undefined || basePrice === null) {
        console.error('Missing price information');
        throw new Error('Missing price information: basePrice is required');
      }

      console.log('Creating promotion checkout session...', { 
        packageId,
        trackId: typeof trackId === 'string' ? trackId.substring(0, 20) + '...' : 'invalid', // Log truncated for security
        artistId: typeof artistId === 'string' ? artistId.substring(0, 10) + '...' : 'not provided',
        price: basePrice,
        isPro: Boolean(discountApplied)
      });
      
      const finalPrice = Math.round(basePrice * 100);
      let tierName, submissionCount, estimatedAdditions;
      
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

      // Normalize track ID format
      let normalizedTrackId = trackId;
      let normalizedArtistId = artistId || '';
      
      // Handle different track ID formats
      if (typeof trackId === 'string') {
        if (trackId.includes('spotify:track:')) {
          const parts = trackId.split(':');
          normalizedTrackId = parts[parts.length - 1];
        } else if (trackId.includes('spotify.com/track/')) {
          const parts = trackId.split('/track/');
          normalizedTrackId = parts[1]?.split('?')[0] || trackId;
        }
      }
      
      console.log('Normalized track ID:', normalizedTrackId);

      let promotionRecord;
      try {
        // Create a new promotion record in the database
        console.log('Creating promotion database record with data:', {
          user_id: user.id,
          spotify_track_id: normalizedTrackId,
          track_name: trackName,
          track_artist: artistName,
          spotify_artist_id: normalizedArtistId || 'unknown',
          genre: genre || 'other',
          total_cost: finalPrice / 100,
          package_tier: packageId.toLowerCase()
        });
        
        const { data: promotion, error: promotionError } = await supabaseAdmin
          .from('promotions')
          .insert({
            user_id: user.id,
            spotify_track_id: normalizedTrackId,
            track_name: trackName,
            track_artist: artistName,
            spotify_artist_id: normalizedArtistId || 'unknown',
            genre: genre || 'other',
            total_cost: finalPrice / 100, // Store price in dollars
            status: 'payment_pending', 
            created_at: new Date().toISOString(),
            submission_count: submissionCount,
            estimated_additions: estimatedAdditions,
            success_rate: 0, // Initialize at 0
            package_tier: packageId.toLowerCase()
          })
          .select('id')
          .single();

        if (promotionError) {
          console.error('Error creating promotion record:', promotionError);
          console.error('SQL Error:', promotionError.code, promotionError.message, promotionError.details);
          throw new Error('Failed to create promotion record: ' + promotionError.message);
        }

        console.log('Promotion record created successfully:', promotion);
        promotionRecord = promotion;

        // Create Stripe checkout session
        try {
          console.log('Creating Stripe checkout session with price:', finalPrice);
          
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
                      promotionId: promotionRecord.id,
                      trackId: normalizedTrackId,
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
              promotionId: promotionRecord.id,
              userId: user.id,
              type: 'promotion',
              trackName,
              trackArtist: artistName,
              spotifyTrackId: normalizedTrackId,
              spotifyArtistId: normalizedArtistId || 'unknown',
              submissionCount: submissionCount.toString(),
              estimatedAdditions: estimatedAdditions.toString(),
              genre: genre || 'other',
              packageId,
              isProDiscount: discountApplied ? 'true' : 'false',
              discountPercent: discountApplied ? '25' : '0'
            },
            client_reference_id: promotionRecord.id,
          });

          console.log('Stripe checkout session created successfully:', {
            sessionId: session.id,
            url: session.url
          });

          // Return the checkout URL
          return new Response(
            JSON.stringify({
              checkoutUrl: session.url,
              promotionId: promotionRecord.id,
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
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } 
    // Handle regular subscription checkout flow
    else {
      const { priceId, isSubscription } = requestData;
      
      if (!priceId) {
        throw new Error('No price ID provided');
      }

      console.log('Creating regular payment session...', { 
        priceId, 
        isSubscription,
        userId: user.id,
        email 
      });

      const session = await stripe.checkout.sessions.create({
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
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error creating payment session:', error);
    
    // Additional error debug info
    const debugInfo = {
      error: error.message || "An unknown error occurred",
      errorName: error.name,
      errorCode: error.code,
      stripeError: error.type === 'StripeError',
      timestamp: new Date().toISOString()
    };
    
    console.error('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    // Try to log to database
    try {
      await supabaseAdmin
        .rpc('log_edge_function_error', {
          p_function_name: 'create-checkout-session',
          p_request_data: JSON.stringify(requestData || {}),
          p_error_message: JSON.stringify(debugInfo),
          p_status_code: 500
        });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        success: false,
        debug: debugInfo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
