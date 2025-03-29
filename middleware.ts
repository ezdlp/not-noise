
import { NextRequest, NextResponse } from 'next/server';

// List of known crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'WhatsApp',
  'Twitterbot',
  'LinkedInBot',
  'Pinterest',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'googlebot',
  'bingbot',
  'Pinterestbot',
  'Applebot',
  'yandexbot',
  'baiduspider',
  'DuckDuckBot',
  'facebot',
  'ia_archiver',
  'social-media-preview'
];

// Function to determine if the request is from a crawler
function isSocialMediaCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

export default function middleware(request: NextRequest) {
  // Get the user agent
  const userAgent = request.headers.get('user-agent');
  
  // Check if this is a smart link URL
  if (request.nextUrl.pathname.startsWith('/link/')) {
    // If it's a social media crawler, redirect to the API route for pre-rendering
    if (isSocialMediaCrawler(userAgent)) {
      console.log('Social media crawler detected:', userAgent);
      const slug = request.nextUrl.pathname.replace('/link/', '');
      return NextResponse.rewrite(new URL(`/api/social-preview/${slug}`, request.url));
    }
  }
  
  // Continue with the normal flow for all other requests
  return NextResponse.next();
}
