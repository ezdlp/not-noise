
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
    console.log('Starting Spotify popularity backfill job...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get Spotify API credentials
    const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
    const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
    
    if (!spotifyClientId || !spotifyClientSecret) {
      throw new Error('Missing Spotify API credentials');
    }
    
    // Parse request body for specific parameters
    const { batchSize = 50, startFromId, skipIds = [] } = await req.json().catch(() => ({}));
    
    console.log(`Backfill parameters: batchSize=${batchSize}, startFromId=${startFromId || 'none'}, skipIds count=${skipIds.length}`);
    console.log('Fetching Spotify access token...');
    
    // Get access token from Spotify
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
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to obtain Spotify access token: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('Successfully obtained Spotify access token');
    
    // Get all historical pro user IDs
    const { data: proUserIds, error: userError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('tier', 'pro');
      
    if (userError) {
      throw new Error(`Failed to fetch pro users: ${userError.message}`);
    }
    
    // Get a batch of smart links that:
    // 1. Belong to users who have/had a pro subscription
    // 2. Don't already have popularity data
    // 3. Have a Spotify platform link
    let query = supabase
      .from('smart_links')
      .select(`
        id,
        platform_links!inner (
          id,
          platform_id,
          url
        )
      `)
      .in('user_id', proUserIds.map(u => u.user_id))
      .not('id', 'in', (
        // Subquery to get smart links that already have popularity data
        await supabase
          .from('spotify_popularity_history')
          .select('smart_link_id')
          .then(result => result.data?.map(h => h.smart_link_id) || [])
      ));
      
    // Add conditions based on parameters
    if (startFromId) {
      query = query.gt('id', startFromId);
    }
    
    if (skipIds.length > 0) {
      query = query.not('id', 'in', skipIds);
    }
    
    // Get the links and limit the batch size
    const { data: smartLinks, error: linksError } = await query
      .limit(batchSize)
      .order('id', { ascending: true });
    
    if (linksError) {
      throw new Error(`Failed to fetch smart links: ${linksError.message}`);
    }
    
    console.log(`Found ${smartLinks?.length || 0} smart links to backfill`);
    
    if (!smartLinks || smartLinks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more links to process', 
          complete: true 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Process each smart link
    const updates = [];
    const errors = [];
    const processedIds = [];
    
    for (const link of smartLinks) {
      try {
        processedIds.push(link.id);
        
        // Find the Spotify platform link
        const spotifyLink = link.platform_links.find(pl => pl.platform_id === 'spotify');
        
        if (!spotifyLink) {
          console.log(`Link ${link.id} does not have a Spotify URL, skipping`);
          continue;
        }
        
        // Extract Spotify track ID from URL
        const spotifyUrl = spotifyLink.url;
        const trackIdMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
        
        if (!trackIdMatch || !trackIdMatch[1]) {
          console.log(`Could not extract track ID from URL: ${spotifyUrl}`);
          continue;
        }
        
        const trackId = trackIdMatch[1];
        
        console.log(`Backfilling track ${trackId} for link ${link.id}`);
        
        // Fetch track details from Spotify API
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching track ${trackId}: ${response.status} - ${errorText}`);
          errors.push({
            linkId: link.id,
            trackId,
            error: `${response.status} - ${errorText}`
          });
          continue;
        }
        
        const track = await response.json();
        const popularityScore = track.popularity;
        
        console.log(`Track ${trackId} has popularity score: ${popularityScore}`);
        
        // Store popularity score in the database
        const { error: insertError } = await supabase
          .from('spotify_popularity_history')
          .insert({
            smart_link_id: link.id,
            popularity_score: popularityScore
          });
          
        if (insertError) {
          console.error(`Error storing popularity for link ${link.id}: ${insertError.message}`);
          errors.push({
            linkId: link.id,
            trackId,
            error: insertError.message
          });
        } else {
          updates.push({
            linkId: link.id,
            trackId,
            score: popularityScore
          });
          console.log(`Successfully stored popularity score for link ${link.id}`);
        }
      } catch (err) {
        console.error(`Error processing track for link ${link.id}: ${err.message}`);
        errors.push({
          linkId: link.id,
          error: err.message
        });
      }
      
      // Add a small delay to avoid hitting Spotify API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Determine the last processed ID for pagination
    const lastProcessedId = processedIds.length > 0 ? processedIds[processedIds.length - 1] : null;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated popularity scores for ${updates.length} tracks`,
        updates,
        errors: errors.length > 0 ? errors : undefined,
        lastProcessedId: lastProcessedId,
        complete: smartLinks.length < batchSize,
        processedCount: processedIds.length
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
