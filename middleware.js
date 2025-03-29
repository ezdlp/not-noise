
// Middleware to detect social media crawlers and serve pre-rendered SEO meta tags
export default function middleware(req) {
  const url = new URL(req.url);
  
  // Only handle smart link routes
  if (!url.pathname.startsWith('/link/')) {
    return;
  }
  
  // Detect social crawlers by user agent
  const userAgent = req.headers.get('user-agent') || '';
  const isSocialCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|google-structured-data|discordbot/i.test(userAgent);
  
  if (isSocialCrawler) {
    // Redirect to the API endpoint for social sharing
    const slug = url.pathname.replace('/link/', '');
    return Response.redirect(`${url.origin}/api/social-sharing/${slug}`, 307);
  }
}

export const config = {
  matcher: ['/link/:slug*'],
}
