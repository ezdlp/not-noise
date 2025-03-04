
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
    const requestBody = await req.json().catch(() => ({}));
    const { smartLinkId, startDate } = requestBody;
    
    if (!smartLinkId) {
      throw new Error('Smart link ID is required');
    }
    
    console.log(`Fetching Spotify popularity data for link ${smartLinkId}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get popularity history for this smart link
    const defaultStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago by default
    const { data, error } = await supabase.rpc('get_spotify_popularity_history', { 
      p_smart_link_id: smartLinkId,
      p_start_date: startDate || defaultStartDate
    });
    
    if (error) {
      console.error(`Failed to fetch popularity history: ${error.message}`);
      throw new Error(`Failed to fetch popularity history: ${error.message}`);
    }
    
    console.log(`Retrieved ${data?.length || 0} popularity records`);
    
    // If no data, trigger a fetch for this specific link
    if (!data || data.length === 0) {
      console.log('No popularity data found, triggering immediate fetch for this link');
      
      try {
        // Get Spotify link information
        const { data: linkData, error: linkError } = await supabase
          .from('smart_links')
          .select(`
            id,
            platform_links (
              id, 
              platform_id,
              url
            ),
            profiles!inner (id)
          `)
          .eq('id', smartLinkId)
          .single();
          
        if (linkError || !linkData) {
          console.error(`Failed to fetch link data: ${linkError?.message || 'No data found'}`);
        } else {
          const spotifyLink = linkData.platform_links.find(pl => pl.platform_id === 'spotify');
          
          if (spotifyLink) {
            console.log(`Found Spotify link, triggering fetch for track in URL: ${spotifyLink.url}`);
            
            // Get Spotify API credentials
            const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
            const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
            
            if (!spotifyClientId || !spotifyClientSecret) {
              console.error('Missing Spotify API credentials, cannot trigger immediate fetch');
            } else {
              // Get Spotify access token
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
                console.error(`Failed to obtain Spotify access token: ${tokenResponse.status}`);
              } else {
                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;
                
                // Extract track ID
                const trackIdMatch = spotifyLink.url.match(/track\/([a-zA-Z0-9]+)/);
                
                if (!trackIdMatch || !trackIdMatch[1]) {
                  console.error(`Could not extract track ID from URL: ${spotifyLink.url}`);
                } else {
                  const trackId = trackIdMatch[1];
                  
                  // Fetch track details
                  const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`
                    }
                  });
                  
                  if (!trackResponse.ok) {
                    console.error(`Error fetching track ${trackId}: ${trackResponse.status}`);
                  } else {
                    const track = await trackResponse.json();
                    const popularityScore = track.popularity;
                    
                    // Store popularity score
                    const { error: insertError } = await supabase
                      .from('spotify_popularity_history')
                      .insert({
                        smart_link_id: smartLinkId,
                        popularity_score: popularityScore
                      });
                      
                    if (insertError) {
                      console.error(`Error storing popularity: ${insertError.message}`);
                    } else {
                      console.log(`Successfully stored popularity score ${popularityScore} for link ${smartLinkId}`);
                      
                      // Add the newly created record to the results
                      data.push({
                        measured_at: new Date().toISOString(),
                        popularity_score: popularityScore
                      });
                    }
                  }
                }
              }
            }
          } else {
            console.log('No Spotify link found for this smart link');
          }
        }
      } catch (fetchError) {
        console.error(`Error during immediate popularity fetch: ${fetchError.message}`);
      }
    }
    
    // Calculate trend (last 7 days vs previous 7 days)
    const sortedData = [...(data || [])].sort((a, b) => 
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
        
        if (previous7Days.length > 0) {
          const last7DaysAvg = last7Days.reduce((sum, item) => sum + item.popularity_score, 0) / last7Days.length;
          const previous7DaysAvg = previous7Days.reduce((sum, item) => sum + item.popularity_score, 0) / previous7Days.length;
          
          trendValue = Math.round(last7DaysAvg - previous7DaysAvg);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        history: sortedData,
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
