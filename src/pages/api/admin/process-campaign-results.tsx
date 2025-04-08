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
      return res.status(404).json({ message: 'File not found', error: fileError?.message });
    }

    // Parse the CSV
    const csvText = await fileData.text();
    
    // Add error handling for CSV parsing
    let records;
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      // Log first record to see column names
      console.log("CSV Columns:", records.length > 0 ? Object.keys(records[0]) : "No records");
      
    } catch (csvError: any) {
      console.error("CSV Parse Error:", csvError);
      return res.status(400).json({ 
        message: 'Failed to parse CSV file', 
        error: csvError.message 
      });
    }
    
    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid' });
    }

    // Get column names (different files might have different casing)
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord);
    
    // Find the action, outlet and feedback columns regardless of case
    const actionColumn = columns.find(col => col.toLowerCase() === 'action') || 'Action';
    const outletColumn = columns.find(col => col.toLowerCase() === 'outlet') || 'Outlet';
    const feedbackColumn = columns.find(col => col.toLowerCase() === 'feedback') || 'Feedback';
    
    // Filter for only the necessary columns and valid actions
    const filteredRecords = records
      .filter((r: any) => {
        const action = r[actionColumn];
        return action && (
          action.toLowerCase() === 'approved' || 
          action.toLowerCase() === 'declined'
        );
      })
      .map((r: any) => ({
        curator_name: r[outletColumn] || '',
        action: r[actionColumn] || '',
        feedback: r[feedbackColumn] || ''
      }));
    
    console.log(`Filtered ${filteredRecords.length} records out of ${records.length} total`);

    // Calculate campaign stats
    const totalSubmissions = records.length;
    const approved = records.filter((r: any) => {
      const action = r[actionColumn];
      return action && (action.toLowerCase() === 'approved' || action.toLowerCase() === 'shared');
    }).length;
    
    const declined = records.filter((r: any) => {
      const action = r[actionColumn];
      return action && action.toLowerCase() === 'declined';
    }).length;
    
    const pending = records.filter((r: any) => {
      const action = r[actionColumn];
      return action && action.toLowerCase() === 'listen';
    }).length;
    
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0;
    
    // Calculate average listen time if it exists
    const listenTimeColumn = columns.find(col => col.toLowerCase().includes('listen') && col.toLowerCase().includes('time'));
    let averageListenTime = 0;
    
    if (listenTimeColumn) {
      const listenTimes = records
        .filter((r: any) => r[listenTimeColumn] && !isNaN(parseInt(r[listenTimeColumn])))
        .map((r: any) => parseInt(r[listenTimeColumn]));
      
      averageListenTime = listenTimes.length > 0 
        ? listenTimes.reduce((sum: number, time: number) => sum + time, 0) / listenTimes.length 
        : 0;
    }
    
    // Count submissions by country if country data exists
    const countryColumn = columns.find(col => col.toLowerCase().includes('country'));
    const countryBreakdown: Record<string, number> = {};
    
    if (countryColumn) {
      records.forEach((r: any) => {
        const country = r[countryColumn] || 'Unknown';
        countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
      });
    }
    
    // Count submissions by outlet type if type data exists
    const typeColumn = columns.find(col => col.toLowerCase().includes('type'));
    const outletTypeBreakdown: Record<string, number> = {};
    
    if (typeColumn) {
      records.forEach((r: any) => {
        const type = r[typeColumn] || 'Unknown';
        outletTypeBreakdown[type] = (outletTypeBreakdown[type] || 0) + 1;
      });
    }

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
        console.log("Sending to OpenAI for analysis:", JSON.stringify(filteredRecords).slice(0, 200) + "...");
        
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
        console.log("OpenAI Response received:", aiResponse ? aiResponse.slice(0, 200) + "..." : "No response");
        
        if (aiResponse) {
          try {
            aiAnalysis = JSON.parse(aiResponse);
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            aiAnalysis = { 
              error: "Failed to parse AI analysis",
              campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
              key_takeaways: ["Analysis unavailable at this time."],
              actionable_points: ["Try analyzing again later."] 
            };
          }
        }
      } catch (aiError: any) {
        console.error("Error generating AI analysis:", aiError);
        aiAnalysis = { 
          error: "AI analysis generation failed: " + aiError.message,
          campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
          key_takeaways: ["Analysis unavailable at this time."],
          actionable_points: ["Try analyzing again later."]
        };
      }
    } else {
      // Provide fallback if no records to analyze
      aiAnalysis = {
        campaign_report: [],
        key_takeaways: ["No approved or declined feedback to analyze."],
        actionable_points: ["Ensure your CSV contains feedback with 'approved' or 'declined' actions."]
      };
    }

    // Store the parsed results with AI analysis
    try {
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
        console.error("Error inserting results:", resultsError);
      }
    } catch (dbError: any) {
      console.error("Database error:", dbError);
    }

    // Update the campaign_results status
    try {
      const { error: statusError } = await supabase
        .from('campaign_results')
        .insert({
          campaign_id: campaignId,
          file_path: filePath,
          status: 'processed',
          processed_at: new Date().toISOString(),
        });

      if (statusError) {
        console.error("Error updating status:", statusError);
      }
    } catch (statusError: any) {
      console.error("Status update error:", statusError);
    }

    // Update the campaign status to delivered if it was active
    if (campaign.status === 'active') {
      try {
        await supabase
          .from('promotions')
          .update({ 
            status: 'completed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', campaignId);
      } catch (updateError: any) {
        console.error("Error updating campaign status:", updateError);
      }
    }

    return res.status(200).json({
      message: 'Campaign results processed successfully',
      stats: enhancedStats,
      aiAnalysis,
      rawData: records.slice(0, 10), // Only return a sample to reduce payload size
    });

  } catch (error: any) {
    console.error('Error processing campaign results:', error);
    return res.status(500).json({
      message: 'Failed to process campaign results',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
