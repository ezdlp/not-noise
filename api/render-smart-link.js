module.exports = async (req, res) => {
  console.log('Render Smart Link API: Request received - redirecting to new OG preview endpoint');
  
  // Get slug from URL parameters
  const slug = req.query.slug;
  if (!slug) {
    return res.status(400).send('Missing slug parameter');
  }

  // Redirect to the new endpoint
  res.statusCode = 302;
  res.setHeader('Location', `/api/og-preview?slug=${encodeURIComponent(slug)}`);
  res.end();
}; 