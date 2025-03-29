import { supabase } from "@/integrations/supabase/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid slug parameter' });
  }

  try {
    let smartLink = null;

    const { data: slugData, error } = await supabase
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

    if (error) {
      console.error('Error fetching smart link for social preview:', error);
      return res.status(500).json({ error: 'Failed to fetch smart link data' });
    }

    if (!slugData) {
      const { data: linkById, error: idError } = await supabase
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

      if (idError || !linkById) {
        return res.status(404).json({ error: 'Smart link not found' });
      }

      smartLink = linkById;
    } else {
      smartLink = slugData;
    }

    const artworkUrl = smartLink.artwork_url?.startsWith('http') 
      ? smartLink.artwork_url 
      : `https://soundraiser.io${smartLink.artwork_url}`;

    const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;

    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;

    const canonicalUrl = `https://soundraiser.io/link/${slug}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${fullTitle}</title>
          
          <!-- Primary Meta Tags -->
          <meta name="title" content="${fullTitle}">
          <meta name="description" content="${description}">
          
          <!-- Open Graph / Facebook -->
          <meta property="og:type" content="music.song">
          <meta property="og:url" content="${canonicalUrl}">
          <meta property="og:title" content="${fullTitle}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${artworkUrl}">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          <meta property="og:site_name" content="Soundraiser">
          
          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${canonicalUrl}">
          <meta property="twitter:title" content="${fullTitle}">
          <meta property="twitter:description" content="${description}">
          <meta property="twitter:image" content="${artworkUrl}">
          
          <!-- iOS specific -->
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
          
          <!-- Canonical link -->
          <link rel="canonical" href="${canonicalUrl}">
          
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              max-width: 600px;
              padding: 20px;
            }
            .artwork {
              max-width: 300px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            h1 {
              margin-top: 20px;
              color: #333;
            }
            p {
              color: #666;
            }
            .redirect {
              margin-top: 30px;
              font-size: 14px;
              color: #999;
            }
          </style>
          
          <script>
            setTimeout(() => {
              window.location.href = "${canonicalUrl}";
            }, 50);
          </script>
        </head>
        <body>
          <div class="container">
            <img src="${artworkUrl}" alt="${smartLink.title}" class="artwork">
            <h1>${fullTitle}</h1>
            <p>${description}</p>
            <p class="redirect">Redirecting to Soundraiser...</p>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error generating social preview:', error);
    return res.status(500).json({ error: 'Failed to generate preview' });
  }
}
