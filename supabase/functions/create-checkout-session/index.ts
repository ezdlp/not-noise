
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@15.7.0'; // Using the latest Stripe version
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
    
    console.log(`Initializing Stripe with API version 2024-09-30.acacia`);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-09-30.acacia', // Updated to consistent API version
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
        discountApplied,
        promotionId,
        isResumingPayment,
        artistId
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
        email,
        isResumingPayment,
        promotionId,
        artistId
      });

      // Use the basePrice directly since the discount has already been applied in the frontend
      const finalPrice = Math.round(basePrice * 100);

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
      let normalizedArtistId = artistId || '';
      
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
      console.log('Artist ID:', normalizedArtistId);

      let promotionRecord;

      try {
        if (isResumingPayment && promotionId) {
          // If resuming payment, get the existing promotion record but don't create a new one
          console.log('Resuming payment for promotion:', promotionId);
          
          const { data: existingPromotion, error: getPromotionError } = await supabaseAdmin
            .from('promotions')
            .select('*')
            .eq('id', promotionId)
            .eq('user_id', user.id)
            .single();
            
          if (getPromotionError) {
            console.error('Error fetching existing promotion:', getPromotionError);
            throw new Error('Failed to find the promotion: ' + getPromotionError.message);
          }
          
          if (!existingPromotion) {
            throw new Error('Promotion not found or you don\'t have permission to access it');
          }
          
          if (existingPromotion.status !== 'payment_pending') {
            throw new Error('This promotion is not in a payment pending state');
          }
          
          promotionRecord = existingPromotion;
          console.log('Found existing promotion record:', promotionRecord);
          
          // Update the package_tier field if it's not already set
          if (!promotionRecord.package_tier) {
            const { error: updateError } = await supabaseAdmin
              .from('promotions')
              .update({ 
                package_tier: packageId.toLowerCase(),
                updated_at: new Date().toISOString()
              })
              .eq('id', promotionId);
              
            if (updateError) {
              console.error('Error updating promotion record:', updateError);
            } else {
              console.log('Updated promotion with package_tier:', packageId.toLowerCase());
              promotionRecord.package_tier = packageId.toLowerCase();
            }
          }
        } else {
          // Create a new promotion record - USING ADMIN CLIENT to bypass RLS
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
              spotify_artist_id: normalizedArtistId || 'unknown', // Use 'unknown' if artist ID is not available
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
            console.error('Error creating promotion:', promotionError);
            console.error('Attempted data:', {
              user_id: user.id,
              spotify_track_id: normalizedTrackId,
              track_name: trackName,
              track_artist: artistName,
              spotify_artist_id: normalizedArtistId || 'unknown',
              genre: genre || 'other',
              total_cost: finalPrice / 100,
              package_tier: packageId.toLowerCase()
            });
            throw new Error('Failed to create promotion record: ' + promotionError.message);
          }

          console.log('Promotion record created successfully:', promotion);
          promotionRecord = promotion;
        }

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
              discountPercent: discountApplied ? '25' : '0',
              isResumingPayment: isResumingPayment ? 'true' : 'false'
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
          p_request_data: requestData || {},
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
