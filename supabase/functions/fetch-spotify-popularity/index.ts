
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
    console.log('Starting Spotify popularity tracking job...');
    
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
    
    // Get all pro user IDs (both current and previous pro users)
    console.log('Fetching Pro user IDs...');
    const { data: proUserIds, error: userError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('tier', 'pro');
      
    if (userError) {
      throw new Error(`Failed to fetch pro users: ${userError.message}`);
    }
    
    if (!proUserIds || proUserIds.length === 0) {
      console.log('No Pro users found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Pro users found, nothing to track'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log(`Found ${proUserIds.length} Pro users`);
    
    // Get smart links with Spotify tracks belonging to Pro users
    console.log('Fetching smart links with Spotify tracks belonging to Pro users...');
    
    const { data: smartLinks, error: linksError } = await supabase
      .from('smart_links')
      .select(`
        id,
        platform_links!inner (
          id,
          platform_id,
          url
        ),
        user_id
      `)
      .in('user_id', proUserIds.map(u => u.user_id))
      .filter('platform_links.platform_id', 'eq', 'spotify');
    
    if (linksError) {
      throw new Error(`Failed to fetch smart links: ${linksError.message}`);
    }
    
    console.log(`Found ${smartLinks?.length || 0} smart links with Spotify tracks`);
    
    if (!smartLinks || smartLinks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No smart links with Spotify tracks found'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Check which links need updating (haven't been updated in the last 3 days)
    console.log('Checking which links need popularity tracking updates...');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { data: recentlyTrackedLinks, error: recentError } = await supabase
      .from('spotify_popularity_history')
      .select('smart_link_id')
      .gte('measured_at', threeDaysAgo.toISOString());
      
    if (recentError) {
      console.warn(`Error checking recent popularity data: ${recentError.message}`);
    }
    
    // Create a set of links that have been recently tracked
    const recentlyTrackedSet = new Set(recentlyTrackedLinks?.map(item => item.smart_link_id) || []);
    
    // Filter links that need updating
    const linksToUpdate = smartLinks.filter(link => !recentlyTrackedSet.has(link.id));
    
    console.log(`Found ${linksToUpdate.length} links that need popularity updates`);
    
    if (linksToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All links have been recently tracked, nothing to update'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Process each smart link that needs updating
    const updates = [];
    const errors = [];
    
    // Use a reasonable batch size
    const batchSize = 25;
    const linksToProcess = linksToUpdate.slice(0, batchSize);
    
    console.log(`Processing up to ${batchSize} links in this run: ${linksToProcess.length} links selected`);
    
    for (const link of linksToProcess) {
      try {
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
        
        console.log(`Processing track ${trackId} for link ${link.id}`);
        
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
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    const remainingLinks = linksToUpdate.length - linksToProcess.length;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated popularity scores for ${updates.length} tracks, with ${errors.length} errors`,
        totalProUsers: proUserIds.length,
        totalSmartLinks: smartLinks.length,
        linksNeedingUpdates: linksToUpdate.length,
        linksProcessed: linksToProcess.length,
        remainingLinks: remainingLinks,
        updates,
        errors: errors.length > 0 ? errors : undefined
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
