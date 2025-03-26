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
      .select('*, profiles:user_id(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Download the CSV file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('campaign-data')
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

    // Extract feedback and campaign data
    const feedbackData = records
      .filter((record: any) => record.feedback && record.feedback.trim() !== '')
      .map((record: any) => ({
        action: record.action,
        feedback: record.feedback,
        country: record.outlet_country,
        listen_time: record.listen_time || 'N/A',
      }));

    // Calculate campaign stats
    const totalSubmissions = records.length;
    const approved = records.filter((r: any) => r.action === 'approved' || r.action === 'shared').length;
    const declined = records.filter((r: any) => r.action === 'declined').length;
    const pending = records.filter((r: any) => r.action === 'listen').length;
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0;

    // Generate AI analysis if we have enough feedback
    let aiAnalysis = null;
    if (feedbackData.length >= 3) {
      try {
        const aiResponse = await generateAIAnalysis(campaign, feedbackData);
        aiAnalysis = aiResponse;
      } catch (error) {
        console.error('AI analysis generation failed:', error);
        // Continue without AI analysis if it fails
      }
    }

    // Update campaign with results
    const { error: updateError } = await supabase
      .from('promotions')
      .update({
        status: 'completed',
        submission_count: totalSubmissions,
        approval_count: approved,
        approval_rate: approvalRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      throw updateError;
    }

    // Store the parsed results and analysis
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
        ai_analysis: aiAnalysis,
        processed_at: new Date().toISOString(),
      });

    if (resultsError) {
      throw resultsError;
    }

    // Update the campaign_results status
    const { error: statusError } = await supabase
      .from('campaign_results')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('file_path', filePath);

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

async function generateAIAnalysis(campaign: any, feedbackData: any[]) {
  // Prepare a prompt for GPT-4
  const prompt = `
    I have a Spotify playlist promotion campaign for a track called "${campaign.track_name}" by ${campaign.track_artist}.
    
    Here's the curator feedback from the campaign:
    ${feedbackData.map(f => `- ${f.action.toUpperCase()} from ${f.country}: "${f.feedback}" (Listen time: ${f.listen_time} seconds)`).join('\n')}
    
    Based on this feedback, please provide:
    1. A brief summary of how the campaign performed and key themes in the feedback (3-4 sentences)
    2. 3-5 aspects of the track that worked well according to curators
    3. 3-5 areas for improvement based on curator comments
    4. 5 specific, actionable recommendations for future releases and campaigns
    5. 3-4 quick bullet point insights from the campaign
    
    Format your response as JSON with the following structure:
    {
      "summary": "string",
      "positives": ["string", "string"],
      "areas_for_improvement": ["string", "string"],
      "recommendations": ["string", "string"],
      "insights": ["string", "string"]
    }
    
    Only return the JSON, no other text.
  `;
  
  // Call GPT-4
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: "You are an expert music industry analyst who specializes in analyzing Spotify playlist campaign results." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });
  
  try {
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error parsing AI analysis:', error);
    return null;
  }
} 