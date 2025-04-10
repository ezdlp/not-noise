import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from 'https://esm.sh/csv-parse/sync'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  // Additional logging for debugging
  console.log("[process-campaign-results] Function invoked", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[process-campaign-results] Handling OPTIONS preflight request");
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
    let requestData;
    try {
      requestData = await req.json();
      console.log("[process-campaign-results] Request data parsed:", requestData);
    } catch (parseError) {
      console.error("[process-campaign-results] JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ message: 'Invalid JSON', error: parseError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { campaignId, filePath } = requestData;

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[process-campaign-results] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ message: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    )

    // Get auth user (if available)
    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
        
        if (userError) {
          console.log("[process-campaign-results] Auth error:", userError);
        } else if (user) {
          userId = user.id
          console.log("[process-campaign-results] Authenticated user:", userId);
          
          // Check if user is admin - Check BOTH is_admin flag AND user_roles table
          // First check profiles.is_admin
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single()
            
          // Next check user_roles table for admin role
          const { data: roleData, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle()

          console.log("[process-campaign-results] Admin checks:", {
            profileCheck: profile?.is_admin || false,
            roleCheck: roleData ? true : false,
            profileError: profileError?.message || null,
            roleError: roleError?.message || null
          });
          
          // Allow if EITHER check passes
          const isAdmin = (profile && profile.is_admin === true) || (roleData !== null);
          
          if (!isAdmin) {
            console.log("[process-campaign-results] Authorization failed - not admin");
            return new Response(
              JSON.stringify({ message: 'Forbidden - Admin access required' }),
              {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          } else {
            console.log("[process-campaign-results] Admin authorization successful");
          }
        }
      } catch (authError) {
        console.error("[process-campaign-results] Auth processing error:", authError);
        // Continue with the function, but log the error
      }
    } else {
      console.log("[process-campaign-results] No auth header present");
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
        JSON.stringify({ message: 'Campaign not found', error: campaignError?.message }),
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
        trim: true,
        relax_column_count: true, // More forgiving CSV parsing
        skip_records_with_error: true // Skip problematic rows instead of failing
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
    const outletColumn = columns.find(col => 
      col.toLowerCase() === 'outlet' || 
      col.toLowerCase() === 'curator' || 
      col.toLowerCase() === 'playlist'
    )
    const feedbackColumn = columns.find(col => col.toLowerCase() === 'feedback' || col.toLowerCase() === 'notes')
    const playlistUrlColumn = columns.find(col => 
      col.toLowerCase().includes('playlist') && 
      (col.toLowerCase().includes('url') || col.toLowerCase().includes('link'))
    )
    
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
    
    // Define valid statuses that count as submissions
    const validActionTypes = ['approved', 'declined', 'shared'];
    
    // Filter for valid submissions only - those with approved, declined, or shared status
    const validSubmissionRecords = records.filter(r => {
      const action = (r[actionColumn] || '').toLowerCase();
      return validActionTypes.includes(action);
    });
    
    console.log(`[process-campaign-results] Found ${validSubmissionRecords.length} valid submissions out of ${records.length} total records`);
    
    // Map curators by name to avoid duplicates
    const curatorMap = new Map();
    
    validSubmissionRecords.forEach(r => {
      const action = (r[actionColumn] || '').toLowerCase();
      const curatorName = r[outletColumn] || '';
      const feedback = r[feedbackColumn] || '';
      const playlistUrl = playlistUrlColumn ? r[playlistUrlColumn] || '' : '';
      
      if (!curatorName) return; // Skip entries without curator name
      
      const curatorKey = curatorName.trim().toLowerCase();
      const isApproved = action === 'approved' || action === 'shared';
      const existingCurator = curatorMap.get(curatorKey);
      
      // Extract potential URLs from feedback for shared entries
      let extractedUrls = '';
      if (action === 'shared' && feedback) {
        // Use a better regex that captures full URLs even with query parameters
        const urlMatches = feedback.match(/https?:\/\/[^\s]+/g);
        if (urlMatches && urlMatches.length > 0) {
          extractedUrls = urlMatches.join('\n');
        }
      }
      
      const effectivePlaylistUrl = playlistUrl || extractedUrls;
      
      // If this curator already exists in our map
      if (existingCurator) {
        // Update if either:
        // 1. Current entry is approved/shared and we don't have approval yet
        // 2. Current entry has a playlist URL and existing one doesn't
        // 3. Or this is a shared entry with URLs in feedback 
        const shouldUpdateAction = isApproved && existingCurator.action !== 'Approved';
        const shouldUpdateUrl = action === 'shared' && extractedUrls && !existingCurator.playlist_link;
        
        if (shouldUpdateAction || shouldUpdateUrl) {
          curatorMap.set(curatorKey, {
            ...existingCurator,
            action: isApproved ? 'Approved' : existingCurator.action,
            playlist_link: effectivePlaylistUrl || existingCurator.playlist_link,
            feedback: action === 'shared' && extractedUrls ? extractedUrls : existingCurator.feedback
          });
        }
      } else {
        // Add new curator entry - for shared entries with URLs, use the URLs as feedback
        curatorMap.set(curatorKey, {
          curator_name: curatorName,
          // Standardize action names: "approved" or "shared" → "Approved", "declined" → "Declined"
          action: isApproved ? 'Approved' : 'Declined',
          feedback: action === 'shared' && extractedUrls ? extractedUrls : feedback,
          playlist_link: effectivePlaylistUrl || undefined
        });
      }
    });
    
    // Convert map to array for processing
    const filteredRecords = Array.from(curatorMap.values());
    
    console.log(`[process-campaign-results] De-duplicated to ${filteredRecords.length} unique curators`);
    
    // Validate we have at least one valid record after filtering
    if (filteredRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No valid records found in CSV',
          hint: 'Please ensure your CSV contains at least one record with "approved", "shared", or "declined" in the Action column'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate campaign stats based only on valid submissions (unique curators)
    const totalSubmissions = filteredRecords.length;
    const approved = filteredRecords.filter(r => r.action === 'Approved').length;
    const declined = filteredRecords.filter(r => r.action === 'Declined').length;
    
    // Double-check that approved + declined equals totalSubmissions
    console.log(`[process-campaign-results] Stats: total=${totalSubmissions}, approved=${approved}, declined=${declined}`);
    
    // Calculate approval rate based on valid submissions
    const approvalRate = totalSubmissions > 0 ? (approved / totalSubmissions) * 100 : 0;
    
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
        
        // Updated system prompt with improved instructions for actionable points
        const systemPrompt = `
        You are Playlist Insights Bot, a specialist assistant that analyzes curator feedback for a music marketing app. You are given a structured list of curator responses (including their name, action, and feedback).

        You must return your output in the following strict JSON structure, which will be parsed by the backend to populate the user's dashboard:
        
        {
          "campaign_report": [
            {
              "curator_name": "string",
              "action": "Approved or Declined",
              "feedback": "summarized curator feedback",
              "playlist_link": "url of playlist if available or null"
            }
          ],
          "key_takeaways": [
            "Concise, overarching insights gathered from multiple curators' feedback"
          ],
          "actionable_points": [
            "Specific, constructive suggestions based on curator feedback and current genre trends"
          ]
        }

        Important rules:
        - Your response MUST be valid JSON. Do not include markdown formatting, code blocks, or any text before or after the JSON.
        - In the campaign_report array, use ONLY "Approved" or "Declined" for the action field. 
        - If an entry's action is "shared", normalize it to "Approved".
        - Preserve any playlist_link fields if they exist in the input.

        For the key_takeaways, focus on:
        - Summarizing the most frequent feedback themes
        - Highlighting what curators appreciated or didn't like about the track
        - Identifying patterns in the feedback that could guide the artist
        
        For the actionable_points, you MUST provide detailed, specific and valuable advice like a world-class A&R and music production expert would. For example:
        
        - Production Techniques: Offer specific advice (e.g., "Add analog warmth by applying subtle tape saturation to your drums for a more organic sound" or "Enhance dynamics in the bass for better pop playlist compatibility")
        - Arrangement & Dynamics: Suggest arrangement improvements like "Adding vocal layering in the chorus with tight harmonies would create the emotional depth that indie curators are seeking" 
        - Genre-Specific Insights: Identify current genre trends with specific actionable suggestions like "Incorporate more broken-beat rhythms in the verses to align with the current evolution in electronic playlists"
        
        The actionable_points should directly relate to feedback in the curator responses but be expanded with expert insight. Make your suggestions specific and technical enough that an artist can immediately understand what to implement.

        Remember, the actionable points are the most valuable part of your analysis. Offer 3-5 detailed, implementable suggestions that will genuinely help the artist increase their chances of playlist placement with future releases.
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
          const errorText = await openAIResponse.text().catch(() => "Could not read response");
          console.error(`OpenAI API error: ${openAIResponse.status}`, errorText);
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
            
            // Ensure AI response preserves the original playlist links
            if (aiAnalysis.campaign_report && Array.isArray(aiAnalysis.campaign_report)) {
              aiAnalysis.campaign_report = aiAnalysis.campaign_report.map(aiReport => {
                // Find matching original record with playlist link
                const originalRecord = filteredRecords.find(r => 
                  r.curator_name.toLowerCase() === aiReport.curator_name.toLowerCase()
                );
                
                // Preserve the playlist_link from our filtered records if available
                if (originalRecord && originalRecord.playlist_link) {
                  return { ...aiReport, playlist_link: originalRecord.playlist_link };
                }
                
                return aiReport;
              });
            }
            
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
              campaign_report: filteredRecords,
              key_takeaways: ["Analysis unavailable at this time."],
              actionable_points: ["Try analyzing again later."] 
            }
          }
        }
      } catch (aiError) {
        console.error("[process-campaign-results] Error generating AI analysis:", aiError)
        
        aiAnalysis = { 
          error: "AI analysis generation failed: " + aiError.message,
          campaign_report: filteredRecords,
          key_takeaways: ["Analysis unavailable at this time."],
          actionable_points: ["Try analyzing again later."]
        }
      }
    } else {
      // Provide fallback if no records to analyze or no OpenAI key
      console.log("[process-campaign-results] No filtered records for AI analysis or missing OpenAI key")
      aiAnalysis = {
        campaign_report: filteredRecords,
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
          raw_data: { 
            all_records: records, 
            valid_submissions: validSubmissionRecords,
            processed_report: filteredRecords
          },
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
        rawData: validSubmissionRecords.slice(0, 10), // Only return a sample to reduce payload size
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