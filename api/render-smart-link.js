const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with fallbacks for environment variables
// These variable names should match what's set in Vercel
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Log for debugging during deployment
console.log(`Initializing Supabase client with URL: ${supabaseUrl ? 'URL exists' : 'URL missing'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Escape HTML special characters to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Make URL absolute
function getAbsoluteUrl(url) {
  const baseUrl = 'https://soundraiser.io';
  return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Hardcoded template (instead of reading from file system)
function getTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- METADATA_PLACEHOLDER -->
  
  <!-- Base styles for no-JS fallback -->
  <style>
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      background-color: #fafafa;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .artwork {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 24px;
      color: #111827;
      margin-bottom: 8px;
    }
    .artist {
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 18px;
      color: #374151;
      margin-top: 0;
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
    .platforms {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    }
    .platform-button {
      padding: 10px 15px;
      background-color: white;
      border: 1px solid #E6E6E6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #111827;
      font-weight: 500;
      font-size: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .platform-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .platform-icon {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
  </style>
  
  <!-- Inject the main app -->
  <script type="module" src="/src/main.tsx"></script>
</head>
<body>
  <div id="root">
    <!-- FALLBACK_CONTENT_PLACEHOLDER -->
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  try {
    // Get slug from the URL
    const slug = req.query.slug;
    if (!slug) {
      return res.status(400).send('Missing slug parameter');
    }

    console.log(`Rendering smart link for slug: ${slug}`);

    // Check if Supabase client is initialized properly
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing. Check environment variables.');
      return res.status(500).send('Server configuration error');
    }

    // Fetch smart link data from Supabase
    let smartLinkResult;
    try {
      smartLinkResult = await supabase
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
            platform_id,
            platform_name,
            url
          )
        `)
        .eq('slug', slug)
        .maybeSingle();
    } catch (dbError) {
      console.error('Supabase query error:', dbError);
      return res.status(500).send('Database query error');
    }

    const { data: smartLink, error } = smartLinkResult;

    if (error) {
      console.error('Error fetching smart link:', error);
      return res.status(500).send('Error fetching smart link data');
    }

    if (!smartLink) {
      console.error(`Smart link not found for slug: ${slug}`);
      return res.status(404).send('Smart link not found');
    }

    console.log(`Found smart link: ${smartLink.title} by ${smartLink.artist_name}`);

    // Format the title
    const title = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
    
    // Make sure artwork URL is absolute
    const artworkUrl = getAbsoluteUrl(smartLink.artwork_url);

    // Generate the metadata HTML
    const metadataHtml = `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="music.song">
  <meta property="og:url" content="https://soundraiser.io/link/${slug}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${artworkUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://soundraiser.io/link/${slug}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${artworkUrl}">
  <meta name="twitter:domain" content="soundraiser.io">
  
  <!-- Music specific -->
  ${smartLink.release_date ? `<meta property="music:release_date" content="${smartLink.release_date}">` : ''}
  ${smartLink.platform_links?.map(platform => 
    `<meta property="music:musician" content="${platform.url}">`
  ).join('\n  ')}
  
  <!-- Schema.org structured data -->
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
    "url": "https://soundraiser.io/link/${slug}"
  }
  </script>

  <!-- Preload assets -->
  <link rel="preload" href="${artworkUrl}" as="image">`;

    // Generate the fallback content HTML (for non-JS browsers and initial render)
    const fallbackHtml = `
    <div class="container">
      <img class="artwork" src="${artworkUrl}" alt="${escapeHtml(smartLink.title)}" />
      <h1>${escapeHtml(smartLink.title)}</h1>
      <p class="artist">by ${escapeHtml(smartLink.artist_name)}</p>
      
      ${smartLink.platform_links && smartLink.platform_links.length > 0 ? `
      <div class="platforms">
        ${smartLink.platform_links.slice(0, 4).map(platform => `
          <a href="${platform.url}" class="platform-button" target="_blank" rel="noopener">
            <img src="/lovable-uploads/${platform.platform_id.toLowerCase()}.png" alt="${platform.platform_name}" class="platform-icon" onerror="this.src='/lovable-uploads/music.png'">
            ${platform.platform_name}
          </a>
        `).join('')}
      </div>
      ` : ''}
      
      <a href="#" class="cta">Listen on All Platforms</a>
    </div>`;

    // Load and populate the template
    const template = getTemplate();
    if (!template) {
      return res.status(500).send('Error loading template');
    }

    const html = template
      .replace('<!-- METADATA_PLACEHOLDER -->', metadataHtml)
      .replace('<!-- FALLBACK_CONTENT_PLACEHOLDER -->', fallbackHtml);

    // Send the rendered HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering smart link:', error);
    res.status(500).send('Internal Server Error');
  }
}; 