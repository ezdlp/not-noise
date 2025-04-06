
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackName, artistName, genre, stats, feedbackSamples } = await req.json();
    
    // Prepare the prompt for OpenAI
    const prompt = `
    I need you to analyze campaign results for a music track submission to playlist curators.

    Track Information:
    - Title: ${trackName}
    - Artist: ${artistName}
    - Genre: ${genre}
    
    Campaign Statistics:
    - Total Submissions: ${stats.totalSubmissions}
    - Approved: ${stats.approved} (${stats.approvalRate.toFixed(1)}%)
    - Declined: ${stats.declined}
    - Pending: ${stats.pending}
    
    Here are some feedback samples from curators:
    ${feedbackSamples.map((feedback: string, i: number) => `${i+1}. "${feedback}"`).join('\n\n')}
    
    Please provide:
    1. A concise summary of the overall campaign performance
    2. Key insights from the curator feedback (common themes, reasons for rejection or approval)
    3. Suggestions for how the artist might improve future submissions
    4. The track's strengths based on positive feedback
    
    Format your response in HTML sections with appropriate headers and paragraphs.
    `;
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful music industry expert who analyzes campaign results and provides insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error from OpenAI API');
    }
    
    const analysis = data.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred during analysis' }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  }
});
