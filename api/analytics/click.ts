import { supabase } from '../../src/integrations/supabase/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { platformLinkId } = req.body;

        if (!platformLinkId) {
            return res.status(400).json({ error: 'Missing platformLinkId' });
        }

        const { error } = await supabase.from('platform_link_clicks').insert({
            platform_link_id: platformLinkId
        });

        if (error) throw error;

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error recording click:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 