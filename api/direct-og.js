// Simple API that returns a static HTML page with OG metadata for debugging
export default function handler(req, res) {
  const { slug } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  
  console.log(`[Direct-OG API] Received request for slug: ${slug || 'none'}`);
  console.log(`[Direct-OG API] User-Agent: ${userAgent.substring(0, 100)}`);
  
  // Format the title from the slug
  const title = slug ? slug.replace(/-/g, ' ') : 'Music';
  const formattedTitle = title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Simple HTML with basic Open Graph tags
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formattedTitle} | Soundraiser</title>
  
  <!-- Standard Meta Tags -->
  <meta name="description" content="Listen to ${formattedTitle} on all streaming platforms." />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="music.song" />
  <meta property="og:title" content="${formattedTitle} | Soundraiser" />
  <meta property="og:description" content="Listen to ${formattedTitle} on all streaming platforms." />
  <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg" />
  <meta property="og:url" content="https://soundraiser.io/link/${slug}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${formattedTitle} | Soundraiser" />
  <meta name="twitter:description" content="Listen to ${formattedTitle} on all streaming platforms." />
  <meta name="twitter:image" content="https://soundraiser.io/soundraiser-og-image.jpg" />
  
  <!-- Debug Info -->
  <meta name="x-debug-info" content="direct-og-endpoint" />
  <meta name="x-user-agent" content="${userAgent.substring(0, 50).replace(/"/g, '&quot;')}" />
  <meta name="x-timestamp" content="${new Date().toISOString()}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      text-align: center;
      background: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6851FB;
    }
    p {
      color: #333;
      margin-bottom: 20px;
    }
    .cta {
      display: inline-block;
      background: #6851FB;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${formattedTitle}</h1>
    <p>Listen to this release on all your favorite streaming platforms.</p>
    <a href="https://soundraiser.io/link/${slug}" class="cta">Listen Now</a>
  </div>
  
  <script>
    // Redirect to the actual page after a moment
    setTimeout(() => {
      window.location.href = 'https://soundraiser.io/link/${slug}';
    }, 500);
  </script>
</body>
</html>`;

  // Set appropriate headers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Send the HTML
  return res.status(200).send(html);
} 