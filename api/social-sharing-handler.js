
import { createClient } from '@supabase/supabase-js';

// Init Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Extract slug from the path
  const path = req.url;
  const match = path.match(/\/api\/social-sharing\/(.+)/);
  if (!match) {
    return res.status(400).send('Invalid slug');
  }
  
  const slug = match[1];
  
  try {
    // Fetch smart link data
    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select(`
        *,
        platform_links (
          id,
          platform_id,
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();
    
    if (error || !smartLink) {
      // Try to fetch by ID as fallback
      const { data: idData, error: idError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          )
        `)
        .eq('id', slug)
        .maybeSingle();
        
      if (idError || !idData) {
        return res.status(404).send('Smart link not found');
      }
      
      smartLink = idData;
    }
    
    // Generate stream platforms for structured data
    const streamingPlatforms = smartLink.platform_links?.map(pl => ({
      name: pl.platform_name,
      url: pl.url
    })) || [];
    
    // Ensure artwork URL is secure
    const secureArtworkUrl = smartLink.artwork_url?.replace('http:', 'https:');
    
    // Generate action buttons for schema markup
    const actionButtons = streamingPlatforms.map(platform => ({
      "@type": "ListenAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": platform.url,
        "actionPlatform": [
          "http://schema.org/MusicPlatform",
          platform.url
        ]
      },
      "expectsAcceptanceOf": {
        "@type": "Offer",
        "category": "stream"
      }
    }));

    // Enhanced MusicRecording schema
    const musicSchema = {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": smartLink.title,
      "byArtist": {
        "@type": "MusicGroup",
        "name": smartLink.artist_name,
        "@id": `https://soundraiser.io/artist/${encodeURIComponent(smartLink.artist_name)}`
      },
      "image": secureArtworkUrl,
      "description": smartLink.description,
      ...(smartLink.release_date && { "datePublished": smartLink.release_date }),
      "potentialAction": actionButtons,
      "url": `https://soundraiser.io/link/${slug}`,
      "offers": streamingPlatforms.map(platform => ({
        "@type": "Offer",
        "url": platform.url,
        "availability": "https://schema.org/InStock",
        "category": "stream"
      })),
      "publisher": {
        "@type": "Organization",
        "name": "Soundraiser",
        "logo": {
          "@type": "ImageObject",
          "url": "https://soundraiser.io/lovable-uploads/soundraiser-logo/Logo A.png"
        }
      }
    };
    
    // Build the full title
    const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const finalDescription = smartLink.description || `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
    
    // Generate HTML with proper meta tags
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/png" href="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso A fav.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${fullTitle}</title>
          
          <!-- Basic meta tags -->
          <meta name="description" content="${finalDescription}" />
          <link rel="canonical" href="https://soundraiser.io/link/${slug}" />
          <meta http-equiv="content-language" content="en" />
          
          <!-- Open Graph tags optimized for sharing music -->
          <meta property="og:type" content="music.song" />
          <meta property="og:title" content="${fullTitle}" />
          <meta property="og:description" content="${finalDescription}" />
          <meta property="og:url" content="https://soundraiser.io/link/${slug}" />
          <meta property="og:site_name" content="Soundraiser" />
          
          <!-- Image tags with proper dimensions, format, and explicit properties -->
          <meta property="og:image" content="${secureArtworkUrl}" />
          <meta property="og:image:secure_url" content="${secureArtworkUrl}" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta property="og:image:alt" content="${smartLink.title} by ${smartLink.artist_name}" />
          <meta property="og:image:type" content="image/jpeg" />
          
          <!-- Music-specific Open Graph tags -->
          ${smartLink.release_date ? `<meta property="music:release_date" content="${smartLink.release_date}" />` : ''}
          <meta property="music:creator" content="${smartLink.artist_name}" />
          ${streamingPlatforms.map(platform => `<meta property="music:musician" content="${platform.url}" />`).join('')}

          <!-- Twitter Card tags -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${fullTitle}" />
          <meta name="twitter:description" content="${finalDescription}" />
          <meta name="twitter:image" content="${secureArtworkUrl}" />
          <meta name="twitter:image:alt" content="${smartLink.title} by ${smartLink.artist_name}" />
          <meta name="twitter:site" content="@soundraiser_" />

          <!-- Schema.org structured data -->
          <script type="application/ld+json">
            ${JSON.stringify(musicSchema)}
          </script>
          
          <!-- Redirect to the actual page after a short delay -->
          <meta http-equiv="refresh" content="0;url=https://soundraiser.io/link/${slug}" />
        </head>
        <body>
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <img src="${secureArtworkUrl}" alt="${smartLink.title} by ${smartLink.artist_name}" style="width: 200px; height: 200px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; text-align: center;">${smartLink.title}</h1>
            <h2 style="margin: 8px 0 16px; font-size: 18px; font-weight: normal; text-align: center;">by ${smartLink.artist_name}</h2>
            <p style="margin: 0 0 24px; text-align: center;">Redirecting to ${smartLink.title}...</p>
            <a href="https://soundraiser.io/link/${slug}" style="padding: 10px 20px; background-color: #6851FB; color: white; text-decoration: none; border-radius: 4px;">Go to Smart Link</a>
          </div>
        </body>
      </html>
    `;
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // Return the HTML
    return res.send(html);
  } catch (err) {
    console.error('Error generating smart link preview:', err);
    return res.status(500).send('Error generating preview');
  }
}
