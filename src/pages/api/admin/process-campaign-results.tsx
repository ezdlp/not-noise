
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { parse } from 'csv-parse/sync';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError || !user || !user.is_admin) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // Get request body
    const { campaignId, filePath } = req.body;

    if (!campaignId || !filePath) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Get the campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Download the CSV file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('campaign-result-files')
      .download(filePath);

    if (fileError || !fileData) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Parse the CSV
    const csvText = await fileData.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    // Calculate campaign stats
    const totalSubmissions = records.length;
    const approved = records.filter((r: any) => r.action === 'approved' || r.action === 'shared').length;
    const declined = records.filter((r: any) => r.action === 'declined').length;
    const pending = records.filter((r: any) => r.action === 'listen').length;
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0;

    // Store the parsed results
    const { error: resultsError } = await supabase
      .from('campaign_result_data')
      .insert({
        campaign_id: campaignId,
        raw_data: records,
        stats: {
          total_submissions: totalSubmissions,
          approved,
          declined,
          pending,
          approval_rate: approvalRate,
        },
      });

    if (resultsError) {
      throw resultsError;
    }

    // Update the campaign_results status
    const { error: statusError } = await supabase
      .from('campaign_results')
      .insert({
        campaign_id: campaignId,
        file_path: filePath,
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

    if (statusError) {
      throw statusError;
    }

    return res.status(200).json({
      message: 'Campaign results processed successfully',
      stats: {
        totalSubmissions,
        approved,
        declined,
        pending,
        approvalRate,
      },
    });

  } catch (error: any) {
    console.error('Error processing campaign results:', error);
    return res.status(500).json({
      message: 'Failed to process campaign results',
      error: error.message,
    });
  }
}
