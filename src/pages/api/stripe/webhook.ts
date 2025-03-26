import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16' as any,
});

// Disable body parser for this endpoint to get the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await buffer(req);
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.trackName) {
        // This is a promotion purchase
        await handlePromotionCheckoutCompleted(session);
      }
      
      break;
    }
    
    // Handle other events as needed (subscription created, updated, etc.)
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}

/**
 * Handle a completed checkout session for a promotion
 */
async function handlePromotionCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const {
      userId,
      trackName,
      trackArtist,
      spotifyTrackId,
      spotifyArtistId,
      submissionCount,
      estimatedAdditions,
      genre,
      isProDiscount
    } = session.metadata || {};

    if (!userId || !trackName) {
      console.error('Missing required metadata in checkout session');
      return;
    }

    // Get the payment details from the session
    const paymentIntentId = session.payment_intent as string;
    let paymentDetails;
    
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentDetails = paymentIntent;
    }

    // Create a record in the promotions table
    const { data, error } = await supabase.from('promotions').insert({
      user_id: userId,
      track_name: trackName,
      track_artist: trackArtist,
      spotify_track_id: spotifyTrackId,
      spotify_artist_id: spotifyArtistId,
      submission_count: parseInt(submissionCount || '0'),
      estimated_additions: parseInt(estimatedAdditions || '0'),
      genre: genre || 'other',
      status: 'pending',
      total_cost: session.amount_total ? session.amount_total / 100 : 0,
      payment_id: paymentIntentId,
      pro_discount_applied: isProDiscount === 'true',
      package_tier: getPackageTier(parseInt(submissionCount || '0')),
      created_at: new Date().toISOString()
    }).select('id').single();

    if (error) {
      console.error('Error creating promotion record:', error);
      return;
    }

    // Log the successful creation of the promotion for tracking
    console.log(`Promotion created with ID: ${data.id}`);

    // Optional: Send confirmation email to the customer
    // await sendPromotionConfirmationEmail(userId, trackName);
  } catch (error) {
    console.error('Error handling promotion checkout:', error);
  }
}

/**
 * Determine the package tier based on submission count
 */
function getPackageTier(submissionCount: number): string {
  if (submissionCount <= 0) return 'Unknown';
  if (submissionCount <= 20) return 'Silver';
  if (submissionCount <= 35) return 'Gold';
  return 'Platinum';
} 