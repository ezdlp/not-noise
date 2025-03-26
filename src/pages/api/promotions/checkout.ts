import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16' as any, // Type assertion to bypass strict typing
});

// Pro user discount coupon ID - will need to be created in Stripe dashboard
const PRO_DISCOUNT_COUPON_ID = 'pro_user_spotify_discount';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase auth header from the request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - No auth header' });
    }

    // Validate the user session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const userId = user.id;
    const { priceId, promotionData } = req.body;

    if (!priceId || !promotionData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user has an active Pro subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return res.status(500).json({ error: 'Failed to check subscription status' });
    }

    // Determine if the user gets a discount
    const isPro = subscriptionData?.tier === 'pro';
    
    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      discounts: isPro ? [{ coupon: PRO_DISCOUNT_COUPON_ID }] : [],
      success_url: `${req.headers.origin}/spotify-playlist-promotion/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/spotify-playlist-promotion`,
      metadata: {
        userId,
        trackName: promotionData.trackName,
        trackArtist: promotionData.trackArtist,
        spotifyTrackId: promotionData.spotifyTrackId,
        spotifyArtistId: promotionData.spotifyArtistId,
        submissionCount: promotionData.submissionCount.toString(),
        estimatedAdditions: promotionData.estimatedAdditions.toString(),
        genre: promotionData.genre,
        isProDiscount: isPro ? 'true' : 'false',
      },
      customer_email: user.email,
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
} 