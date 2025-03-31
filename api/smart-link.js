import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://owtufhdsuuyrgmxytclj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

export default async function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).send('Missing slug parameter');
  }

  try {
    // Fetch smart link data
    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select(`
        title,
        artist_name,
        artwork_url,
        description,
        platform_links (
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !smartLink) {
      console.error('Error fetching smart link:', error);
      return res.status(404).send('Smart link not found');
    }

    // Ensure artwork URL is absolute
    const artworkUrl = smartLink.artwork_url.startsWith('http') 
      ? smartLink.artwork_url 
      : `https://soundraiser.io${smartLink.artwork_url.startsWith('/') ? '' : '/'}${smartLink.artwork_url}`;

    // Generate HTML with meta tags
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${smartLink.title} by ${smartLink.artist_name} | Stream on all platforms</title>
    
    <!-- Open Graph -->
    <meta property="og:type" content="music.song">
    <meta property="og:title" content="${smartLink.title} by ${smartLink.artist_name} | Stream on all platforms">
    <meta property="og:description" content="${smartLink.description || `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`}">
    <meta property="og:image" content="${artworkUrl}">
    <meta property="og:url" content="https://soundraiser.io/link/${slug}">
    <meta property="og:site_name" content="Soundraiser">
    
    <!-- Facebook -->
    <meta property="fb:app_id" content="1032091254648768">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${smartLink.title} by ${smartLink.artist_name} | Stream on all platforms">
    <meta name="twitter:description" content="${smartLink.description || `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`}">
    <meta name="twitter:image" content="${artworkUrl}">
    
    <!-- Music Specific -->
    <meta property="music:musician" content="${smartLink.artist_name}">
    <meta property="music:creator" content="${smartLink.artist_name}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="1200">

    <!-- Redirect for regular users -->
    <meta http-equiv="refresh" content="0;url=/app/#/link/${slug}">
    <script>window.location.href = '/app/#/link/${slug}';</script>
  </head>
  <body>
    <h1>${smartLink.title} by ${smartLink.artist_name}</h1>
    <p>Redirecting to Smart Link...</p>
  </body>
</html>`;

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal server error');
  }
} 