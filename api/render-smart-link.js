const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
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

// Load the template
function getTemplate() {
  try {
    const templatePath = path.join(__dirname, '../public/smart-link-template.html');
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error('Error reading template file:', error);
    return null;
  }
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
          platform_id,
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

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