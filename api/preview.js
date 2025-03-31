export default function handler(req, res) {
  // Get the slug from the URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const slug = url.pathname.split('/link/')[1];
  
  if (!slug) {
    return res.status(400).send('Missing slug');
  }

  // Format the title from the slug (replace hyphens with spaces and capitalize words)
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Generate the HTML with the correct values
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title} | Stream on all platforms</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://soundraiser.io/link/${slug}">
    <meta property="og:title" content="${title} | Stream on all platforms">
    <meta property="og:description" content="Listen to this release on your favorite streaming platform">
    <meta property="og:image" content="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso%20A%20fav.png">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://soundraiser.io/link/${slug}">
    <meta name="twitter:title" content="${title} | Stream on all platforms">
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
    <h1>${title}</h1>
    <p>Listen to this release on your favorite streaming platform</p>
</body>
</html>`;

  // Set cache headers
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  return res.send(html);
} 