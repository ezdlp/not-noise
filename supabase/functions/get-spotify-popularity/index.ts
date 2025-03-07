
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle getSpotifyPopularity
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract parameters from request
    const { smartLinkId, startDate } = await req.json();
    
    if (!smartLinkId) {
      throw new Error('Missing smart_link_id parameter');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch popularity history
    const { data: history, error: historyError } = await supabase
      .from('spotify_popularity_history')
      .select('measured_at, popularity_score')
      .eq('smart_link_id', smartLinkId)
      .gte('measured_at', startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('measured_at', { ascending: true });
      
    if (historyError) {
      throw new Error(`Failed to fetch popularity history: ${historyError.message}`);
    }
    
    // Get the latest score and calculate trend
    const latestScore = history && history.length > 0 
      ? history[history.length - 1].popularity_score 
      : null;
      
    // Calculate trend based on first and last measurements (if we have at least 2)
    let trendValue = 0;
    if (history && history.length >= 2) {
      const firstScore = history[0].popularity_score;
      const lastScore = history[history.length - 1].popularity_score;
      
      if (firstScore > 0) {
        trendValue = Math.round(((lastScore - firstScore) / firstScore) * 100);
      } else if (lastScore > 0) {
        // If first score was 0, but now we have a score, that's positive
        trendValue = 100;
      }
    }
    
    // Check if we need to track now (if we don't have recent data)
    let needsTracking = true;
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    if (history && history.length > 0) {
      const latestMeasurement = new Date(history[history.length - 1].measured_at);
      needsTracking = latestMeasurement < twentyFourHoursAgo;
    }
    
    if (needsTracking) {
      console.log(`Need to track popularity for smart link ${smartLinkId} now`);
      // Find Spotify track ID for this smart link
      const { data: linkData, error: linkError } = await supabase
        .from('smart_links')
        .select(`
          id,
          platform_links (
            id,
            platform_id,
            url
          )
        `)
        .eq('id', smartLinkId)
        .single();
        
      if (linkError) {
        console.error(`Error fetching link data: ${linkError.message}`);
      } else {
        const spotifyLink = linkData.platform_links.find(pl => pl.platform_id === 'spotify');
        
        if (spotifyLink) {
          // Extract track ID
          const trackIdMatch = spotifyLink.url.match(/track\/([a-zA-Z0-9]+)/);
          
          if (trackIdMatch && trackIdMatch[1]) {
            const trackId = trackIdMatch[1];
            
            try {
              // Get Spotify API credentials
              const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
              const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
              
              if (!spotifyClientId || !spotifyClientSecret) {
                throw new Error('Missing Spotify API credentials');
              }
              
              // Get access token
              const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`
                },
                body: new URLSearchParams({
                  'grant_type': 'client_credentials'
                })
              });
              
              if (!tokenResponse.ok) {
                throw new Error(`Failed to obtain Spotify access token: ${tokenResponse.status}`);
              }
              
              const tokenData = await tokenResponse.json();
              const accessToken = tokenData.access_token;
              
              // Fetch track popularity
              const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
              
              if (!response.ok) {
                throw new Error(`Error fetching track ${trackId}: ${response.status}`);
              }
              
              const track = await response.json();
              const popularityScore = track.popularity;
              
              console.log(`Track ${trackId} has popularity score: ${popularityScore}`);
              
              // Store in database
              await supabase
                .from('spotify_popularity_history')
                .insert({
                  smart_link_id: smartLinkId,
                  popularity_score: popularityScore
                });
                
              // Add to our history array for immediate display
              history.push({
                measured_at: new Date().toISOString(),
                popularity_score: popularityScore
              });
              
              // Update latest score and trend
              if (history.length >= 2) {
                const firstScore = history[0].popularity_score;
                const lastScore = popularityScore;
                
                if (firstScore > 0) {
                  trendValue = Math.round(((lastScore - firstScore) / firstScore) * 100);
                }
              }
            } catch (err) {
              console.error(`Error tracking popularity: ${err.message}`);
            }
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        history: history || [],
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
