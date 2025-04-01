import { supabase } from '../../src/integrations/supabase/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { smartLinkId, userAgent } = req.body;

        if (!smartLinkId) {
            return res.status(400).json({ error: 'Missing smartLinkId' });
        }

        const { error } = await supabase.from('link_views').insert({
            smart_link_id: smartLinkId,
            user_agent: userAgent
        });

        if (error) throw error;

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error recording view:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 