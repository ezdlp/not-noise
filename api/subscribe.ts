import { supabase } from '../src/integrations/supabase/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, smartLinkId } = req.body;

        if (!email || !smartLinkId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await supabase.from('email_subscribers').insert({
            email,
            smart_link_id: smartLinkId
        });

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(200).json({ success: true, message: 'Already subscribed' });
            }
            throw error;
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error subscribing:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 