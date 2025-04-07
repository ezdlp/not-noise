
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any, // Ensure this matches the version used in other Stripe function calls
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Missing Stripe webhook secret' });
    }

    // Get the raw body for signature verification
    const rawBody = req.body;
    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    console.log('Received event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        const userId = checkoutSession.metadata?.userId;
        const eventType = checkoutSession.metadata?.type;
        const promotionId = checkoutSession.metadata?.promotionId;
        
        console.log('Processing checkout completion:', {
          userId,
          eventType,
          promotionId,
          paymentStatus: checkoutSession.payment_status
        });

        // If this is a promotion payment and it's paid
        if (eventType === 'promotion' && checkoutSession.payment_status === 'paid' && userId) {
          // If we have a promotion ID, update it
          if (promotionId) {
            const { data: existingPromotion, error: fetchError } = await supabase
              .from('promotions')
              .select('*')
              .eq('id', promotionId)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('Error fetching promotion:', fetchError);
            } 
            
            if (existingPromotion) {
              console.log('Updating existing promotion:', promotionId);
              
              const { error: updateError } = await supabase
                .from('promotions')
                .update({ 
                  status: 'active',
                  updated_at: new Date().toISOString(),
                  start_date: new Date().toISOString()
                })
                .eq('id', promotionId);
              
              if (updateError) {
                console.error('Error updating promotion:', updateError);
              }
            } else {
              // If promotion ID doesn't exist, create it
              const { trackName, trackArtist, spotifyTrackId, spotifyArtistId, submissionCount, estimatedAdditions, genre, packageId } = checkoutSession.metadata || {};
              
              const { error: createError } = await supabase
                .from('promotions')
                .insert({
                  id: promotionId,
                  user_id: userId,
                  track_name: trackName,
                  track_artist: trackArtist,
                  spotify_track_id: spotifyTrackId,
                  spotify_artist_id: spotifyArtistId,
                  submission_count: parseInt(submissionCount || '0', 10),
                  estimated_additions: parseInt(estimatedAdditions || '0', 10),
                  genre: genre || 'other',
                  package_tier: packageId?.toLowerCase() || 'silver',
                  total_cost: (checkoutSession.amount_total || 0) / 100,
                  status: 'payment_pending',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (createError) {
                console.error('Error creating promotion:', createError);
              }
            }
          }
        }
        break;
        
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
