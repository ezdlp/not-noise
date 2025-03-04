
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smartLinkId, startDate } = await req.json();
    
    if (!smartLinkId) {
      throw new Error('Smart link ID is required');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get popularity history for this smart link
    const { data, error } = await supabase.rpc('get_spotify_popularity_history', { 
      p_smart_link_id: smartLinkId,
      p_start_date: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago by default
    });
    
    if (error) {
      throw new Error(`Failed to fetch popularity history: ${error.message}`);
    }
    
    // Calculate trend (last 7 days vs previous 7 days)
    const sortedData = [...data].sort((a, b) => 
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    );
    
    let trendValue = 0;
    let latestScore = null;
    
    if (sortedData.length > 0) {
      // Get latest score
      latestScore = sortedData[sortedData.length - 1].popularity_score;
      
      // Calculate trend if we have enough data
      if (sortedData.length > 7) {
        const last7Days = sortedData.slice(-7);
        const previous7Days = sortedData.slice(-14, -7);
        
        const last7DaysAvg = last7Days.reduce((sum, item) => sum + item.popularity_score, 0) / last7Days.length;
        const previous7DaysAvg = previous7Days.reduce((sum, item) => sum + item.popularity_score, 0) / previous7Days.length;
        
        trendValue = Math.round(last7DaysAvg - previous7DaysAvg);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        history: data,
        latestScore,
        trendValue
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
