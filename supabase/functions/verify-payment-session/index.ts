
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@15.7.0'; // Updated to match version in create-checkout-session
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
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-09-30.acacia' as any, // Use type assertion to bypass the TypeScript error
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 3,
    });

    // Get the session ID from the request body
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('No session ID provided');
    }

    console.log('Verifying payment session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Return promotion details if payment was successful
    if (session.payment_status === 'paid') {
      // Check the type of payment from metadata
      const paymentType = session.metadata?.type;
      const promotionId = session.metadata?.promotionId;
      
      if (paymentType === 'promotion') {
        // If we have a specific promotion ID, check if it exists and update if needed
        if (promotionId) {
          const { data: promotionData, error: promotionError } = await supabaseClient
            .from('promotions')
            .select('*')
            .eq('id', promotionId)
            .single();
            
          if (promotionError) {
            console.error('Error fetching promotion:', promotionError);
          } else if (promotionData && promotionData.status === 'payment_pending') {
            // Update the promotion status if it's still pending
            const { error: updateError } = await supabaseClient
              .from('promotions')
              .update({ 
                status: 'active',
                start_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', promotionId);
              
            if (updateError) {
              console.error('Error updating promotion status:', updateError);
            } else {
              console.log('Successfully updated promotion status to active');
            }
          }
        }
        
        // Return the promotion details from the session metadata
        const promotionDetails = {
          trackName: session.metadata?.trackName,
          trackArtist: session.metadata?.trackArtist,
          submissionCount: parseInt(session.metadata?.submissionCount || '0'),
          estimatedAdditions: parseInt(session.metadata?.estimatedAdditions || '0'),
          genre: session.metadata?.genre || 'other',
          packageId: session.metadata?.packageId || 'silver',
          promotionId: promotionId,
        };

        return new Response(
          JSON.stringify({ 
            success: true,
            type: 'promotion',
            promotion: promotionDetails
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else if (paymentType === 'subscription') {
        // For subscription payments, check if user has active subscription
        const { data: subscriptionData, error } = await supabaseClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('tier', 'pro')
          .eq('status', 'active')
          .single();
          
        if (error) {
          console.error('Error fetching subscription:', error);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            type: 'subscription',
            subscription: subscriptionData || null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // Generic success response for other payment types
      return new Response(
        JSON.stringify({ 
          success: true,
          type: 'unknown',
          sessionId: session.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Payment not completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
