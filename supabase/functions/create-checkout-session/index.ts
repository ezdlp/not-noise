
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

  // Initialize Supabase client with SERVICE ROLE key to bypass RLS
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Also create a client with the user's token for user-specific operations
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

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      throw new Error('Server configuration error: Missing Stripe credentials');
    }
    
    console.log(`Initializing Stripe with API version 2025-02-24.acacia`);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia', 
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

      // Validate required parameters and log diagnostics
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

      // Parse and normalize the Spotify track ID
      console.log('Original track ID format:', trackId);
      
      // Normalize track ID format
      let normalizedTrackId = trackId;
      let artistId = requestData.artistId || '';
      
      // Handle different track ID formats
      if (typeof trackId === 'string') {
        if (trackId.includes('spotify:track:')) {
          // Format: spotify:track:1234567890
          const parts = trackId.split(':');
          normalizedTrackId = parts[parts.length - 1];
        } else if (trackId.includes('spotify.com/track/')) {
          // Format: https://open.spotify.com/track/1234567890
          const parts = trackId.split('/track/');
          normalizedTrackId = parts[1]?.split('?')[0] || trackId;
        }
      }
      
      console.log('Normalized track ID:', normalizedTrackId);
      console.log('Artist ID:', artistId);

      try {
        // Create a record in the promotions table - USING ADMIN CLIENT to bypass RLS
        console.log('Creating promotion database record with data:', {
          user_id: user.id,
          spotify_track_id: normalizedTrackId,
          track_name: trackName,
          track_artist: artistName,
          spotify_artist_id: artistId || 'unknown',
          genre: genre || 'other',
          total_cost: finalPrice / 100
        });
        
        const { data: promotion, error: promotionError } = await supabaseAdmin
          .from('promotions')
          .insert({
            user_id: user.id,
            spotify_track_id: normalizedTrackId,
            track_name: trackName,
            track_artist: artistName,
            spotify_artist_id: artistId || 'unknown', // Use 'unknown' if artist ID is not available
            genre: genre || 'other',
            total_cost: finalPrice / 100, // Store price in dollars
            status: 'pending', 
            created_at: new Date().toISOString(),
            submission_count: submissionCount,
            estimated_additions: estimatedAdditions,
            success_rate: 0 // Initialize at 0
          })
          .select('id')
          .single();

        if (promotionError) {
          console.error('Error creating promotion:', promotionError);
          console.error('Attempted data:', {
            user_id: user.id,
            spotify_track_id: normalizedTrackId,
            track_name: trackName,
            track_artist: artistName,
            spotify_artist_id: artistId || 'unknown',
            genre: genre || 'other',
            total_cost: finalPrice / 100
          });
          throw new Error('Failed to create promotion record: ' + promotionError.message);
        }

        console.log('Promotion record created successfully:', promotion);

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
                      promotionId: promotion.id,
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
              promotionId: promotion.id,
              userId: user.id,
              type: 'promotion',
              trackName,
              trackArtist: artistName,
              spotifyTrackId: normalizedTrackId,
              spotifyArtistId: artistId || 'unknown',
              submissionCount: submissionCount.toString(),
              estimatedAdditions: estimatedAdditions.toString(),
              genre: genre || 'other',
              packageId,
              isProDiscount: discountApplied ? 'true' : 'false'
            },
            client_reference_id: promotion.id,
          });

          console.log('Stripe checkout session created successfully:', {
            sessionId: session.id,
            url: session.url
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
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
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
        success: false,
        stack: error.stack || "No stack trace available"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
