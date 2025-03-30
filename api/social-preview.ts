
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

// Make URL absolute
function getAbsoluteUrl(url: string): string {
  if (!url) return 'https://soundraiser.io/soundraiser-og-image.jpg';
  const baseUrl = 'https://soundraiser.io';
  return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("SOCIAL PREVIEW REQUEST:", {
    ua: req.headers['user-agent'],
    slug: req.query.slug,
    url: req.url
  });

  // Set essential headers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  
  try {
    // Extract the slug from the URL
    const slug = req.query.slug as string;
    
    if (!slug) {
      console.error('Error: Missing slug parameter');
      return res.status(200).send(generateErrorHtml());
    }

    // Verify Supabase credentials
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Supabase credentials missing');
      return res.status(200).send(generateErrorHtml());
    }

    // Fetch smart link data from Supabase
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
      console.error('Supabase query error:', error);
      return res.status(200).send(generateErrorHtml());
    }

    if (!smartLink) {
      console.error(`Smart link not found for slug: ${slug}`);
      return res.status(200).send(generateErrorHtml());
    }

    console.log(`Found smart link: ${smartLink.title} by ${smartLink.artist_name}`);

    // Prepare data for the HTML
    const title = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
    const artworkUrl = getAbsoluteUrl(smartLink.artwork_url);
    const pageUrl = `https://soundraiser.io/link/${slug}`;

    // Generate HTML with proper Open Graph tags
    const html = generateHtml(
      title,
      description,
      artworkUrl,
      pageUrl,
      smartLink.artist_name,
      smartLink.release_date,
      smartLink.platform_links
    );

    // Send the HTML response
    return res.send(html);
  } catch (error) {
    console.error('Unhandled error in social preview handler:', error);
    return res.status(200).send(generateErrorHtml());
  }
}

// Generate HTML for the social media preview
function generateHtml(
  title: string,
  description: string,
  artworkUrl: string,
  pageUrl: string,
  artistName: string,
  releaseDate?: string,
  platformLinks?: any[]
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Standard Meta Tags -->
  <meta property="og:type" content="music.song">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${artworkUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Soundraiser">
  <meta property="fb:app_id" content="1032091254648768">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${artworkUrl}">
  <meta name="twitter:domain" content="soundraiser.io">
  
  <!-- Music-specific Tags -->
  ${releaseDate ? `<meta property="music:release_date" content="${releaseDate}">` : ''}
  ${platformLinks?.map((platform: any) => 
    `<meta property="music:musician" content="${platform.url}">`
  ).join('\n  ') || ''}
  
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": "${escapeHtml(artistName)}",
    "byArtist": {
      "@type": "MusicGroup",
      "name": "${escapeHtml(artistName)}"
    },
    "image": "${artworkUrl}",
    "description": "${escapeHtml(description)}",
    ${releaseDate ? `"datePublished": "${releaseDate}",` : ''}
    "url": "${pageUrl}"
  }
  </script>
  
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
    <img class="artwork" src="${artworkUrl}" alt="${escapeHtml(title)}">
    <h1>${escapeHtml(title)}</h1>
    <p class="artist">by ${escapeHtml(artistName)}</p>
    <p>${escapeHtml(description)}</p>
    <a href="${pageUrl}" class="cta">Listen on All Platforms</a>
  </div>
</body>
</html>`;
}

// Generate error HTML
function generateErrorHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soundraiser - Smart Links for Musicians</title>
  <meta name="description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  
  <!-- OpenGraph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Soundraiser - Smart Links for Musicians">
  <meta property="og:description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
  <meta property="og:url" content="https://soundraiser.io">
  <meta property="og:site_name" content="Soundraiser">
  <meta property="fb:app_id" content="1032091254648768">
  
  <!-- Twitter Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Soundraiser - Smart Links for Musicians">
  <meta name="twitter:description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  <meta name="twitter:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
</head>
<body>
  <div style="max-width: 600px; margin: 100px auto; text-align: center; font-family: sans-serif;">
    <h1>Soundraiser</h1>
    <p>Smart Links for Musicians</p>
    <a href="https://soundraiser.io" style="display: inline-block; background: #6851FB; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px;">Visit Soundraiser</a>
  </div>
</body>
</html>`;
}
