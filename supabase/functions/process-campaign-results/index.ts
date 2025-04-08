import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from 'https://esm.sh/csv-parse/sync'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log("[process-campaign-results] Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body
    const requestData = await req.json()
    const { campaignId, filePath } = requestData

    console.log("[process-campaign-results] Request received:", { 
      method: req.method,
      campaignId,
      filePath
    });

    if (!campaignId || !filePath) {
      console.log("[process-campaign-results] Missing parameters:", { campaignId, filePath });
      return new Response(
        JSON.stringify({ message: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role (has full access to the database)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get auth user (if available)
    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
      
      if (userError) {
        console.log("[process-campaign-results] Auth error:", userError);
      } else if (user) {
        userId = user.id
        console.log("[process-campaign-results] Authenticated user:", userId);
        
        // Check if user is admin
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single()
        
        if (profileError || !profile || !profile.is_admin) {
          console.log("[process-campaign-results] Authorization failed:", { profileError, profile });
          return new Response(
            JSON.stringify({ message: 'Forbidden - Admin access required' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    // Get the campaign details
    console.log("[process-campaign-results] Fetching campaign:", campaignId);
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      console.log("[process-campaign-results] Campaign fetch error:", campaignError);
      return new Response(
        JSON.stringify({ message: 'Campaign not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Download the CSV file from storage
    console.log("[process-campaign-results] Downloading file from path:", filePath);
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from('campaign-result-files')
      .download(filePath)

    if (fileError || !fileData) {
      console.log("[process-campaign-results] File download error:", fileError);
      return new Response(
        JSON.stringify({ message: 'File not found', error: fileError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse the CSV
    console.log("[process-campaign-results] File downloaded, parsing CSV");
    const csvText = await fileData.text()
    
    // Add robust CSV validation and error handling
    let records
    try {
      // Log the first 200 characters of the CSV to help with debugging
      console.log("[process-campaign-results] CSV preview:", csvText.substring(0, 200).replace(/\n/g, "\\n"))
      
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      
      // Log first record to see column names
      console.log("[process-campaign-results] CSV Columns:", records.length > 0 ? Object.keys(records[0]) : "No records")
      console.log("[process-campaign-results] Total records parsed:", records.length)
      
    } catch (csvError) {
      console.error("[process-campaign-results] CSV Parse Error:", csvError);
      return new Response(
        JSON.stringify({ 
          message: 'Failed to parse CSV file', 
          error: csvError.message,
          hint: 'Please ensure your file is a valid CSV format with properly formatted columns'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'CSV file is empty or invalid',
          hint: 'Please ensure your file contains data rows'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get column names (different files might have different casing)
    const firstRecord = records[0]
    const columns = Object.keys(firstRecord)
    
    // Find the action, outlet and feedback columns regardless of case
    const actionColumn = columns.find(col => col.toLowerCase() === 'action')
    const outletColumn = columns.find(col => col.toLowerCase() === 'outlet')
    const feedbackColumn = columns.find(col => col.toLowerCase() === 'feedback')
    
    // Validate required columns exist
    if (!actionColumn || !outletColumn || !feedbackColumn) {
      console.error("[process-campaign-results] Missing required columns. Found:", columns);
      return new Response(
        JSON.stringify({ 
          message: 'CSV is missing required columns',
          required: ['Action', 'Outlet', 'Feedback'],
          found: columns,
          hint: 'Please ensure your CSV includes Action, Outlet, and Feedback columns (case insensitive)'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Filter for only the necessary columns and valid actions
    const filteredRecords = records
      .filter((r) => {
        const action = r[actionColumn]
        return action && (
          action.toLowerCase() === 'approved' || 
          action.toLowerCase() === 'declined'
        )
      })
      .map((r) => ({
        curator_name: r[outletColumn] || '',
        action: r[actionColumn] || '',
        feedback: r[feedbackColumn] || ''
      }))
    
    console.log(`[process-campaign-results] Filtered ${filteredRecords.length} records out of ${records.length} total`)
    
    // Validate we have at least one valid record after filtering
    if (filteredRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No valid records found in CSV',
          hint: 'Please ensure your CSV contains at least one record with "approved" or "declined" in the Action column'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate campaign stats
    const totalSubmissions = records.length
    const approved = records.filter((r) => {
      const action = r[actionColumn]
      return action && (action.toLowerCase() === 'approved' || action.toLowerCase() === 'shared')
    }).length
    
    const declined = records.filter((r) => {
      const action = r[actionColumn]
      return action && action.toLowerCase() === 'declined'
    }).length
    
    const pending = records.filter((r) => {
      const action = r[actionColumn]
      return action && action.toLowerCase() === 'listen'
    }).length
    
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0
    
    // Calculate average listen time if it exists
    const listenTimeColumn = columns.find(col => col.toLowerCase().includes('listen') && col.toLowerCase().includes('time'))
    let averageListenTime = 0
    
    if (listenTimeColumn) {
      const listenTimes = records
        .filter((r) => r[listenTimeColumn] && !isNaN(parseInt(r[listenTimeColumn])))
        .map((r) => parseInt(r[listenTimeColumn]))
      
      averageListenTime = listenTimes.length > 0 
        ? listenTimes.reduce((sum, time) => sum + time, 0) / listenTimes.length 
        : 0
    }
    
    // Count submissions by country if country data exists
    const countryColumn = columns.find(col => col.toLowerCase().includes('country'))
    const countryBreakdown = {}
    
    if (countryColumn) {
      records.forEach((r) => {
        const country = r[countryColumn] || 'Unknown'
        countryBreakdown[country] = (countryBreakdown[country] || 0) + 1
      })
    }
    
    // Count submissions by outlet type if type data exists
    const typeColumn = columns.find(col => col.toLowerCase().includes('type'))
    const outletTypeBreakdown = {}
    
    if (typeColumn) {
      records.forEach((r) => {
        const type = r[typeColumn] || 'Unknown'
        outletTypeBreakdown[type] = (outletTypeBreakdown[type] || 0) + 1
      })
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
    }

    // Generate AI analysis if there are filtered records
    let aiAnalysis = null
    if (filteredRecords.length > 0 && OPENAI_API_KEY) {
      try {
        console.log("[process-campaign-results] Sending to OpenAI for analysis - Records count:", filteredRecords.length)
        console.log("[process-campaign-results] First record sample:", JSON.stringify(filteredRecords[0]))
        
        // Send to OpenAI for analysis
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
        `

        console.log("[process-campaign-results] About to call OpenAI API")
        
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(filteredRecords) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 4000,
          })
        })

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API responded with status: ${openAIResponse.status}`)
        }

        const completion = await openAIResponse.json()
        console.log("[process-campaign-results] OpenAI API call completed successfully")
        
        const aiResponse = completion.choices?.[0]?.message?.content
        
        if (aiResponse) {
          console.log("[process-campaign-results] OpenAI Response received length:", aiResponse.length)
          console.log("[process-campaign-results] OpenAI Response preview:", aiResponse.slice(0, 200) + "...")
          
          try {
            console.log("[process-campaign-results] Attempting to parse OpenAI JSON response")
            
            // Try to clean up the response if it has any non-JSON content
            let cleanedResponse = aiResponse
            
            // Remove any markdown code block markers
            cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '')
            
            // Remove any text before the first { or after the last }
            const firstBrace = cleanedResponse.indexOf('{')
            const lastBrace = cleanedResponse.lastIndexOf('}')
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1)
            }
            
            console.log("[process-campaign-results] Cleaned response:", 
              cleanedResponse !== aiResponse ? "Response was cleaned" : "No cleaning needed")
            
            aiAnalysis = JSON.parse(cleanedResponse)
            
            console.log("[process-campaign-results] JSON parsed successfully")
            console.log("[process-campaign-results] Response structure:", 
              `campaign_report: ${aiAnalysis.campaign_report ? aiAnalysis.campaign_report.length : 'missing'} items, ` +
              `key_takeaways: ${aiAnalysis.key_takeaways ? aiAnalysis.key_takeaways.length : 'missing'} items, ` +
              `actionable_points: ${aiAnalysis.actionable_points ? aiAnalysis.actionable_points.length : 'missing'} items`
            )
          } catch (parseError) {
            console.error("[process-campaign-results] Error parsing AI response:", parseError)
            
            try {
              await supabaseAdmin
                .from('system_fixes')
                .insert({
                  type: 'openai_parse_error',
                  campaign_id: campaignId,
                  error_message: parseError.message,
                  raw_response: aiResponse,
                  created_at: new Date().toISOString()
                })
                
              console.log("[process-campaign-results] Stored problematic OpenAI response in system_fixes table")
            } catch (logError) {
              console.error("[process-campaign-results] Error storing debug log:", logError)
            }
            
            aiAnalysis = { 
              error: "Failed to parse AI analysis",
              raw_response: aiResponse.substring(0, 500), // Store first 500 chars of the raw response for debugging
              campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
              key_takeaways: ["Analysis unavailable at this time."],
              actionable_points: ["Try analyzing again later."] 
            }
          }
        }
      } catch (aiError) {
        console.error("[process-campaign-results] Error generating AI analysis:", aiError)
        
        aiAnalysis = { 
          error: "AI analysis generation failed: " + aiError.message,
          campaign_report: filteredRecords.map(r => ({...r, shared_link: null})),
          key_takeaways: ["Analysis unavailable at this time."],
          actionable_points: ["Try analyzing again later."]
        }
      }
    } else {
      // Provide fallback if no records to analyze or no OpenAI key
      console.log("[process-campaign-results] No filtered records for AI analysis or missing OpenAI key")
      aiAnalysis = {
        campaign_report: [],
        key_takeaways: ["No approved or declined feedback to analyze."],
        actionable_points: ["Ensure your CSV contains feedback with 'approved' or 'declined' actions."]
      }
    }

    // Store the parsed results with AI analysis
    try {
      console.log("[process-campaign-results] Storing results in Supabase")
      const { error: resultsError } = await supabaseAdmin
        .from('campaign_result_data')
        .insert({
          campaign_id: campaignId,
          raw_data: records,
          stats: enhancedStats,
          ai_analysis: aiAnalysis,
          processed_at: new Date().toISOString()
        })

      if (resultsError) {
        console.error("[process-campaign-results] Error inserting results:", resultsError)
      } else {
        console.log("[process-campaign-results] Results stored successfully")
      }
    } catch (dbError) {
      console.error("[process-campaign-results] Database error:", dbError)
    }

    // Update the campaign_results status
    try {
      const { error: statusError } = await supabaseAdmin
        .from('campaign_results')
        .insert({
          campaign_id: campaignId,
          file_path: filePath,
          status: 'processed',
          processed_at: new Date().toISOString(),
        })

      if (statusError) {
        console.error("[process-campaign-results] Error updating status:", statusError)
      }
    } catch (statusError) {
      console.error("[process-campaign-results] Status update error:", statusError)
    }

    // Update the campaign status to delivered if it was active
    if (campaign.status === 'active') {
      try {
        await supabaseAdmin
          .from('promotions')
          .update({ 
            status: 'delivered', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', campaignId)
      } catch (updateError) {
        console.error("[process-campaign-results] Error updating campaign status:", updateError)
      }
    }

    console.log("[process-campaign-results] Process completed successfully")
    return new Response(
      JSON.stringify({
        message: 'Campaign results processed successfully',
        stats: enhancedStats,
        aiAnalysis,
        rawData: records.slice(0, 10), // Only return a sample to reduce payload size
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[process-campaign-results] Error processing campaign results:', error)
    
    // Ensure we always return a JSON response even for unexpected errors
    return new Response(
      JSON.stringify({
        message: 'Failed to process campaign results',
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 