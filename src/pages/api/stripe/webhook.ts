import Stripe from 'stripe';
import { supabase } from '../../../supabase/client';
import { getSession } from '../../../utils/supabase';
import { getURL } from '../../../utils/helpers';
import { toast } from 'react-hot-toast';

const handler = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-09-30.acacia',
    });

    if (req.method === 'POST') {
      const body = req.body;
      const event = stripe.webhooks.constructEvent(
        body,
        req.headers['stripe-signature'] || '',
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Extract metadata from the session
        const metadata = session.metadata;
        const userId = session.client_reference_id;

        // When creating a promotion after successful payment, use 'payment_pending' status:
        const { data: promotionData, error: promotionError } = await supabase
          .from('promotions')
          .insert({
            user_id: userId,
            spotify_track_id: metadata.spotifyTrackId,
            spotify_artist_id: metadata.spotifyArtistId,
            track_name: metadata.trackName,
            track_artist: metadata.trackArtist,
            genre: metadata.genre,
            status: 'payment_pending', // Using the correct enum value
            total_cost: session.amount_total! / 100,
            submission_count: parseInt(metadata.submissionCount),
            estimated_additions: parseInt(metadata.estimatedAdditions),
            package_tier: metadata.packageId
          })
          .select()
          .single();

        if (promotionError) {
          console.error('Error creating promotion:', promotionError);
          return res.status(500).json({ error: 'Failed to create promotion' });
        }

        console.log('Promotion created successfully:', promotionData);
        return res.status(200).json({ received: true });
      } else if (event.type === 'invoice.paid') {
        // For subscription payments, create a new subscription record
        const session = event.data.object;
        const userId = session.metadata.userId;
        const tier = session.lines.data[0].plan.id;

        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: tier,
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating subscription:', error);
          return res.status(500).json({ error: 'Failed to create subscription' });
        }

        console.log('Subscription created successfully:', subscriptionData);
        return res.status(200).json({ received: true });
      } else {
        return res.status(200).json({ received: true });
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
