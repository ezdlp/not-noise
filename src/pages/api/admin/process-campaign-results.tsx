import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { parse } from 'csv-parse/sync';
import { OpenAI } from 'openai';
import Cors from 'cors';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  origin: true, // This allows requests from any origin
});

// Helper method to run middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors);

  // Ensure proper content type header is set for all responses
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS requests explicitly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log("[process-campaign-results] Method not allowed:", req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log("[process-campaign-results] Request received:", { 
      method: req.method,
      body: JSON.stringify(req.body).substring(0, 200) // Log partial body for debugging
    });
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[process-campaign-results] Authentication failed: No session");
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError || !user || !user.is_admin) {
      console.log("[process-campaign-results] Authorization failed:", { userError, user });
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // Get request body
    const { campaignId, filePath } = req.body;

    if (!campaignId || !filePath) {
      console.log("[process-campaign-results] Missing parameters:", { campaignId, filePath });
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Get the campaign details
    console.log("[process-campaign-results] Fetching campaign:", campaignId);
    const { data: campaign, error: campaignError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.log("[process-campaign-results] Campaign fetch error:", campaignError);
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Download the CSV file from storage
    console.log("[process-campaign-results] Downloading file from path:", filePath);
    const { data: fileData, error: fileError } = await supabase.storage
      .from('campaign-result-files')
      .download(filePath);

    if (fileError || !fileData) {
      console.log("[process-campaign-results] File download error:", fileError);
      return res.status(404).json({ message: 'File not found', error: fileError?.message });
    }

    // Parse the CSV
    console.log("[process-campaign-results] File downloaded, parsing CSV");
    const csvText = await fileData.text();
    
    // Add robust CSV validation and error handling
    let records;
    try {
      // Log the first 200 characters of the CSV to help with debugging
      console.log("[process-campaign-results] CSV preview:", csvText.substring(0, 200).replace(/\n/g, "\\n"));
      
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      // Log first record to see column names
      console.log("[process-campaign-results] CSV Columns:", records.length > 0 ? Object.keys(records[0]) : "No records");
      console.log("[process-campaign-results] Total records parsed:", records.length);
      
    } catch (csvError: any) {
      console.error("[process-campaign-results] CSV Parse Error:", csvError);
      console.error("[process-campaign-results] CSV Parse Error Stack:", csvError.stack);
      return res.status(400).json({ 
        message: 'Failed to parse CSV file', 
        error: csvError.message,
        hint: 'Please ensure your file is a valid CSV format with properly formatted columns'
      });
    }
    
    if (!records || records.length === 0) {
      return res.status(400).json({ 
        message: 'CSV file is empty or invalid',
        hint: 'Please ensure your file contains data rows'
      });
    }

    // Get column names (different files might have different casing)
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord);
    
    // Find the action, outlet and feedback columns regardless of case
    const actionColumn = columns.find(col => col.toLowerCase() === 'action');
    const outletColumn = columns.find(col => col.toLowerCase() === 'outlet');
    const feedbackColumn = columns.find(col => col.toLowerCase() === 'feedback');
    
    // Validate required columns exist
    if (!actionColumn || !outletColumn || !feedbackColumn) {
      console.error("Missing required columns. Found:", columns);
      return res.status(400).json({ 
        message: 'CSV is missing required columns',
        required: ['Action', 'Outlet', 'Feedback'],
        found: columns,
        hint: 'Please ensure your CSV includes Action, Outlet, and Feedback columns (case insensitive)'
      });
    }
    
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
    
    // Validate we have at least one valid record after filtering
    if (filteredRecords.length === 0) {
      return res.status(400).json({ 
        message: 'No valid records found in CSV',
        hint: 'Please ensure your CSV contains at least one record with "approved" or "declined" in the Action column'
      });
    }

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
        console.log("[process-campaign-results] Sending to OpenAI for analysis - Records count:", filteredRecords.length);
        console.log("[process-campaign-results] First record sample:", JSON.stringify(filteredRecords[0]));
        
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

        Important: Your response MUST be valid JSON. Do not include markdown formatting, code blocks, or any text before or after the JSON. Your entire response should be parseable as JSON.
        `;

        console.log("[process-campaign-results] About to call OpenAI API with model: gpt-4o");
        
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
          max_tokens: 4000,
        });

        console.log("[process-campaign-results] OpenAI API call completed successfully");
        
        const aiResponse = completion.choices[0].message.content;
        console.log("[process-campaign-results] OpenAI Response received length:", aiResponse ? aiResponse.length : "No response");
        console.log("[process-campaign-results] OpenAI Response preview:", aiResponse ? aiResponse.slice(0, 200) + "..." : "No response");
        
        if (aiResponse) {
          try {
            console.log("[process-campaign-results] Attempting to parse OpenAI JSON response");
            
            // Try to clean up the response if it has any non-JSON content
            let cleanedResponse = aiResponse;
            
            // Remove any markdown code block markers
            cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '');
            
            // Remove any text before the first { or after the last }
            const firstBrace = cleanedResponse.indexOf('{');
            const lastBrace = cleanedResponse.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
            }
            
            console.log("[process-campaign-results] Cleaned response:", 
              cleanedResponse !== aiResponse ? "Response was cleaned" : "No cleaning needed");
            
            aiAnalysis = JSON.parse(cleanedResponse);
            
            console.log("[process-campaign-results] JSON parsed successfully");
            console.log("[process-campaign-results] Response structure:", 
              `campaign_report: ${aiAnalysis.campaign_report ? aiAnalysis.campaign_report.length : 'missing'} items, ` +
              `key_takeaways: ${aiAnalysis.key_takeaways ? aiAnalysis.key_takeaways.length : 'missing'} items, ` +
              `actionable_points: ${aiAnalysis.actionable_points ? aiAnalysis.actionable_points.length : 'missing'} items`
            );
          } catch (parseError) {
            console.error("[process-campaign-results] Error parsing AI response:", parseError);
            console.error("[process-campaign-results] Failed JSON string:", aiResponse);
            
            // Store the problematic response for debugging
            try {
              const { error: debugError } = await supabase
                .from('debug_logs')
                .insert({
                  type: 'openai_parse_error',
                  campaign_id: campaignId,
                  error_message: parseError.message,
                  raw_response: aiResponse,
                  created_at: new Date().toISOString()
                });
                
              if (debugError) {
                console.error("[process-campaign-results] Failed to store debug log:", debugError);
              } else {
                console.log("[process-campaign-results] Stored problematic OpenAI response in debug_logs table");
              }
            } catch (logError) {
              console.error("[process-campaign-results] Error storing debug log:", logError);
            }
            
            aiAnalysis = { 
              error: "Failed to parse AI analysis",
              raw_response: aiResponse.substring(0, 500), // Store first 500 chars of the raw response for debugging
              campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
              key_takeaways: ["Analysis unavailable at this time."],
              actionable_points: ["Try analyzing again later."] 
            };
          }
        }
      } catch (aiError: any) {
        console.error("[process-campaign-results] Error generating AI analysis:", aiError);
        console.error("[process-campaign-results] Error details:", {
          message: aiError.message,
          name: aiError.name,
          stack: aiError.stack,
          status: aiError.status,
          response: aiError.response ? JSON.stringify(aiError.response).substring(0, 500) : 'No response'
        });
        
        aiAnalysis = { 
          error: "AI analysis generation failed: " + aiError.message,
          campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
          key_takeaways: ["Analysis unavailable at this time."],
          actionable_points: ["Try analyzing again later."]
        };
      }
    } else {
      // Provide fallback if no records to analyze
      console.log("[process-campaign-results] No filtered records for AI analysis");
      aiAnalysis = {
        campaign_report: [],
        key_takeaways: ["No approved or declined feedback to analyze."],
        actionable_points: ["Ensure your CSV contains feedback with 'approved' or 'declined' actions."]
      };
    }

    // Store the parsed results with AI analysis
    try {
      console.log("[process-campaign-results] Storing results in Supabase");
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
        console.error("[process-campaign-results] Error inserting results:", resultsError);
      } else {
        console.log("[process-campaign-results] Results stored successfully");
      }
    } catch (dbError: any) {
      console.error("[process-campaign-results] Database error:", dbError);
      console.error("[process-campaign-results] Database error details:", {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        stack: dbError.stack
      });
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

    console.log("[process-campaign-results] Process completed successfully");
    return res.status(200).json({
      message: 'Campaign results processed successfully',
      stats: enhancedStats,
      aiAnalysis,
      rawData: records.slice(0, 10), // Only return a sample to reduce payload size
    });

  } catch (error: any) {
    console.error('[process-campaign-results] Error processing campaign results:', error);
    console.error('[process-campaign-results] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    
    // Ensure we always return a JSON response even for unexpected errors
    return res.status(500).json({
      message: 'Failed to process campaign results',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// API route config to increase timeout and max body size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};
