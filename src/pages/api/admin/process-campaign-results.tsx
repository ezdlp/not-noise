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

    // Filter for only the necessary columns and valid actions
    const filteredRecords = records
      .filter((r: any) => r.Action === 'approved' || r.Action === 'declined')
      .map((r: any) => ({
        curator_name: r.Outlet || '',
        action: r.Action || '',
        feedback: r.Feedback || ''
      }));

    // Calculate campaign stats
    const totalSubmissions = records.length;
    const approved = records.filter((r: any) => r.Action === 'approved' || r.Action === 'shared').length;
    const declined = records.filter((r: any) => r.Action === 'declined').length;
    const pending = records.filter((r: any) => r.Action === 'listen').length;
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0;
    
    // Calculate average listen time
    const listenTimes = records
      .filter((r: any) => r.listen_time && !isNaN(parseInt(r.listen_time)))
      .map((r: any) => parseInt(r.listen_time));
    
    const averageListenTime = listenTimes.length > 0 
      ? listenTimes.reduce((sum: number, time: number) => sum + time, 0) / listenTimes.length 
      : 0;
      
    // Count submissions by country
    const countryBreakdown: Record<string, number> = {};
    records.forEach((r: any) => {
      const country = r.outlet_country || 'Unknown';
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
    });
    
    // Count submissions by outlet type
    const outletTypeBreakdown: Record<string, number> = {};
    records.forEach((r: any) => {
      const type = r.outlet_type || 'Unknown';
      outletTypeBreakdown[type] = (outletTypeBreakdown[type] || 0) + 1;
    });

    // Prepare the enhanced stats
    const enhancedStats = {
      totalSubmissions,
      approved,
      declined,
      pending,
      approvalRate,
      averageListenTime,
      countryBreakdown,
      outletTypeBreakdown,
    };

    // Generate AI analysis if there are filtered records
    let aiAnalysis = null;
    if (filteredRecords.length > 0) {
      try {
        // Send to ChatGPT for analysis
        const systemPrompt = `
        You are Playlist Insights Bot, a specialist assistant that analyzes curator feedback for a music marketing app. You are given a structured list of curator responses (including their name, action, and feedback).

        You must return your output in the following strict JSON structure, which will be parsed by the backend to populate the user's dashboard:
        
        {
          "campaign_report": [
            {
              "curator_name": "string",
              "action": "Approved or Declined",
              "feedback": "summarized curator feedback",
              "shared_link": null
            }
          ],
          "key_takeaways": [
            "Concise, overarching insights gathered from multiple curators' feedback"
          ],
          "actionable_points": [
            "Specific, constructive suggestions based on curator feedback and current genre trends"
          ]
        }
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: JSON.stringify(filteredRecords) 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0].message.content;
        if (aiResponse) {
          try {
            aiAnalysis = JSON.parse(aiResponse);
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            aiAnalysis = { error: "Failed to parse AI analysis" };
          }
        }
      } catch (aiError) {
        console.error("Error generating AI analysis:", aiError);
        aiAnalysis = { error: "AI analysis generation failed" };
      }
    }

    // Store the parsed results with AI analysis
    const { error: resultsError } = await supabase
      .from('campaign_result_data')
      .insert({
        campaign_id: campaignId,
        raw_data: records,
        stats: enhancedStats,
        ai_analysis: aiAnalysis,
        processed_at: new Date().toISOString()
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

    // Update the campaign status to delivered if it was active
    if (campaign.status === 'active') {
      await supabase
        .from('promotions')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', campaignId);
    }

    return res.status(200).json({
      message: 'Campaign results processed successfully',
      stats: enhancedStats,
      aiAnalysis,
      rawData: records,
    });

  } catch (error: any) {
    console.error('Error processing campaign results:', error);
    return res.status(500).json({
      message: 'Failed to process campaign results',
      error: error.message,
    });
  }
}
