
import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

// Define Vercel-compatible request and response types
type VercelRequest = IncomingMessage & {
  query: { [key: string]: string | string[] };
  cookies: { [key: string]: string };
  body: any;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Escape HTML special characters to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the slug from the URL path
    const slug = req.query.slug as string;
    
    if (!slug) {
      return res.status(400).send('Missing slug parameter');
    }

    // Debug info
    console.log(`Social preview requested for slug: ${slug}`);
    console.log(`User agent: ${req.headers['user-agent']}`);

    // Query the database for the smart link data
    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select(`
        id,
        title,
        artist_name,
        artwork_url,
        description,
        release_date,
        platform_links (
          id,
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching smart link:', error);
      return res.status(500).send('Error fetching smart link');
    }

    if (!smartLink) {
      console.error(`Smart link not found for slug: ${slug}`);
      return res.status(404).send('Smart link not found');
    }

    console.log(`Found smart link data: ${JSON.stringify(smartLink, null, 2)}`);

    // Format the title
    const title = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;

    // Make the artwork URL absolute
    const baseUrl = 'https://soundraiser.io';
    const artworkUrl = smartLink.artwork_url.startsWith('http') 
      ? smartLink.artwork_url 
      : `${baseUrl}${smartLink.artwork_url.startsWith('/') ? '' : '/'}${smartLink.artwork_url}`;

    // Detect if it's a bot from Facebook, Twitter, etc.
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot|discordbot|telegrambot|whatsapp|linkedinbot|slack/i.test(userAgent);

    // For debugging
    console.log(`Is bot: ${isBot}, User agent: ${userAgent}`);

    // Generate HTML with proper Open Graph tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Preload artwork image -->
  <link rel="preload" href="${artworkUrl}" as="image">
  
  <!-- Standard Meta Tags -->
  <meta property="og:type" content="music.song">
  <meta property="og:url" content="${baseUrl}/link/${slug}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${artworkUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${baseUrl}/link/${slug}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${artworkUrl}">
  <meta name="twitter:domain" content="soundraiser.io">
  
  <!-- Music-specific Tags -->
  ${smartLink.release_date ? `<meta property="music:release_date" content="${smartLink.release_date}">` : ''}
  ${smartLink.platform_links?.map((platform: any) => 
    `<meta property="music:musician" content="${platform.url}">`
  ).join('\n  ')}
  
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": "${escapeHtml(smartLink.title)}",
    "byArtist": {
      "@type": "MusicGroup",
      "name": "${escapeHtml(smartLink.artist_name)}"
    },
    "image": "${artworkUrl}",
    "description": "${escapeHtml(description)}",
    ${smartLink.release_date ? `"datePublished": "${smartLink.release_date}",` : ''}
    "url": "${baseUrl}/link/${slug}"
  }
  </script>
  
  ${!isBot ? `
  <!-- Redirect to the actual page if not a bot -->
  <script>
    window.location.href = '/link/${slug}';
  </script>
  ` : ''}
  
  <!-- Fallback styles for bots that render pages -->
  <style>
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
      background-color: #fafafa;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    img.artwork {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 24px;
      color: #111827;
    }
    p.artist {
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 18px;
      margin-top: 0;
      color: #374151;
    }
    .cta {
      display: inline-block;
      background-color: #6851FB;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      margin-top: 20px;
      transition: background-color 0.2s;
    }
    .cta:hover {
      background-color: #4A47A5;
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="artwork" src="${artworkUrl}" alt="${escapeHtml(smartLink.title)}">
    <h1>${escapeHtml(smartLink.title)}</h1>
    <p class="artist">by ${escapeHtml(smartLink.artist_name)}</p>
    <a href="/link/${slug}" class="cta">Listen on All Platforms</a>
  </div>
</body>
</html>`;

    // Log response for debugging
    console.log('Returning HTML with proper Open Graph tags');

    // Set proper content type and send the HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error in social preview handler:', error);
    res.status(500).send('Internal Server Error');
  }
} 
