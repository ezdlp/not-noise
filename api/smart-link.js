// Simple server-side handler for social media previews
export default function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).send('Missing slug parameter');
  }

  // Static HTML with meta tags
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${slug} | Stream on all platforms</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://soundraiser.io/link/${slug}">
    <meta property="og:title" content="${slug} | Stream on all platforms">
    <meta property="og:description" content="Listen to this release on your favorite streaming platform">
    <meta property="og:image" content="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso%20A%20fav.png">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://soundraiser.io/link/${slug}">
    <meta name="twitter:title" content="${slug} | Stream on all platforms">
    <meta name="twitter:description" content="Listen to this release on your favorite streaming platform">
    <meta name="twitter:image" content="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso%20A%20fav.png">

    <script>
      // Redirect regular users to the actual page
      if (!navigator.userAgent.match(/(bot|facebook|twitter|linkedin|pinterest|whatsapp|telegram)/i)) {
        window.location.href = '/link/${slug}';
      }
    </script>
</head>
<body>
    <h1>${slug}</h1>
    <p>Listen to this release on your favorite streaming platform</p>
</body>
</html>`;

  // Set cache headers
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  return res.send(html);
} 