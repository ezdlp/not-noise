
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmartLink {
  id: string
  title: string
  artist_name: string
  artwork_url: string
  description?: string
  release_date?: string
  content_type?: string
  meta_pixel_id?: string
  meta_view_event?: string
  meta_click_event?: string
  platform_links?: {
    id: string
    platform_id: string
    platform_name: string
    url: string
  }[]
  profiles?: {
    hide_branding: boolean
  }
  email_capture_enabled?: boolean
  email_capture_title?: string
  email_capture_description?: string
}

// Platform icons with absolute URLs
const platformIcons: { [key: string]: string } = {
  spotify: "https://soundraiser.io/_next/image?url=/lovable-uploads/spotify.png&w=64&q=75",
  apple_music: "https://soundraiser.io/_next/image?url=/lovable-uploads/applemusic.png&w=64&q=75",
  youtube_music: "https://soundraiser.io/_next/image?url=/lovable-uploads/youtubemusic.png&w=64&q=75",
  youtube: "https://soundraiser.io/_next/image?url=/lovable-uploads/youtube.png&w=64&q=75",
  amazon_music: "https://soundraiser.io/_next/image?url=/lovable-uploads/amazonmusic.png&w=64&q=75",
  deezer: "https://soundraiser.io/_next/image?url=/lovable-uploads/deezer.png&w=64&q=75",
  soundcloud: "https://soundraiser.io/_next/image?url=/lovable-uploads/soundcloud.png&w=64&q=75",
  itunes: "https://soundraiser.io/_next/image?url=/lovable-uploads/itunes.png&w=64&q=75",
  tidal: "https://soundraiser.io/_next/image?url=/lovable-uploads/tidal.png&w=64&q=75",
  anghami: "https://soundraiser.io/_next/image?url=/lovable-uploads/anghami.png&w=64&q=75",
  napster: "https://soundraiser.io/_next/image?url=/lovable-uploads/napster.png&w=64&q=75",
  boomplay: "https://soundraiser.io/_next/image?url=/lovable-uploads/boomplay.png&w=64&q=75",
  yandex: "https://soundraiser.io/_next/image?url=/lovable-uploads/yandex.png&w=64&q=75",
  beatport: "https://soundraiser.io/_next/image?url=/lovable-uploads/beatport.png&w=64&q=75",
  bandcamp: "https://soundraiser.io/_next/image?url=/lovable-uploads/bandcamp.png&w=64&q=75",
  audius: "https://soundraiser.io/_next/image?url=/lovable-uploads/audius.png&w=64&q=75",
  youtubeMusic: "https://soundraiser.io/_next/image?url=/lovable-uploads/youtubemusic.png&w=64&q=75",
  appleMusic: "https://soundraiser.io/_next/image?url=/lovable-uploads/applemusic.png&w=64&q=75",
  amazonMusic: "https://soundraiser.io/_next/image?url=/lovable-uploads/amazonmusic.png&w=64&q=75"
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[Render Smart Link] Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    
    console.log(`[Render Smart Link] Request URL: ${url.toString()}`);
    console.log(`[Render Smart Link] User Agent: ${userAgent}`);
    console.log(`[Render Smart Link] Referer: ${referer}`);
    
    // Enhanced crawler detection with more user agents
    const crawlerRegex = /(facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|bot|crawl|spider|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex)/i;
    const isCrawler = crawlerRegex.test(userAgent);
    console.log(`[Render Smart Link] Is crawler: ${isCrawler}`);
    
    if (isCrawler) {
      // More detailed debugging for crawler requests
      const crawlerMatches = userAgent.match(crawlerRegex);
      const crawlerType = crawlerMatches ? crawlerMatches[1] : 'Unknown crawler';
      console.log(`[Render Smart Link] Crawler type detected: ${crawlerType}`);
    }
    
    // Log all headers for debugging
    console.log(`[Render Smart Link] All headers:`, Object.fromEntries([...req.headers.entries()]));
    
    // Extract slug from path - handle different formats with enhanced logging
    let slug = '';
    
    // Check for different path patterns
    if (url.pathname.startsWith('/render-smart-link/')) {
      slug = url.pathname.replace(/^\/render-smart-link\//, '');
      console.log(`[Render Smart Link] Extracted from /render-smart-link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/link/')) {
      slug = url.pathname.replace(/^\/link\//, '');
      // Remove any trailing '/seo' if present
      slug = slug.replace(/\/seo$/, '');
      console.log(`[Render Smart Link] Extracted from /link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/social-api/link/')) {
      slug = url.pathname.replace(/^\/social-api\/link\//, '');
      console.log(`[Render Smart Link] Extracted from /social-api/link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/og/')) {
      slug = url.pathname.replace(/^\/og\//, '');
      console.log(`[Render Smart Link] Extracted from /og/ path: ${slug}`);
    } else {
      // If none match, try a generic approach
      const segments = url.pathname.split('/').filter(Boolean);
      slug = segments.length ? segments[segments.length - 1] : '';
      console.log(`[Render Smart Link] Extracted using generic approach: ${slug}`);
    }
    
    // Remove any trailing slashes
    slug = slug ? slug.replace(/\/$/, '') : '';
    
    console.log(`[Render Smart Link] Final slug for lookup: "${slug}"`);
    
    if (!slug) {
      console.error('[Render Smart Link] Slug is required');
      return new Response('Slug is required', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Render Smart Link] Missing Supabase credentials');
      return new Response('Server configuration error', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Render Smart Link] Supabase client initialized');

    // Fetch the smart link data by slug first
    console.log(`[Render Smart Link] Attempting to fetch smart link with slug: ${slug}`);
    const { data: smartLinkBySlug, error: slugError } = await supabase
      .from('smart_links')
      .select(`
        *,
        platform_links (
          id,
          platform_id,
          platform_name,
          url
        ),
        profiles:user_id (
          hide_branding
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
      console.error(`[Render Smart Link] Error fetching by slug: ${slugError.message}`);
    } else {
      console.log(`[Render Smart Link] Slug search result: ${smartLinkBySlug ? 'Found' : 'Not found'}`);
    }

    // If not found by slug, try by ID
    if (!smartLinkBySlug && !slugError) {
      console.log(`[Render Smart Link] Attempting to fetch smart link with ID: ${slug}`);
      const { data: smartLinkById, error: idError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          ),
          profiles:user_id (
            hide_branding
          )
        `)
        .eq('id', slug)
        .maybeSingle();

      if (idError) {
        console.error(`[Render Smart Link] Error fetching by ID: ${idError.message}`);
        return new Response(JSON.stringify({ error: 'Error fetching smart link' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!smartLinkById) {
        console.error(`[Render Smart Link] Smart link not found by slug or ID: ${slug}`);
        return new Response(JSON.stringify({ error: 'Smart link not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Render Smart Link] Found smart link by ID: ${smartLinkById.id}`);
      return generateHtmlResponse(smartLinkById);
    }

    if (smartLinkBySlug) {
      console.log(`[Render Smart Link] Found smart link by slug: ${smartLinkBySlug.id}`);
      return generateHtmlResponse(smartLinkBySlug);
    } else {
      console.error(`[Render Smart Link] Smart link not found by slug or ID: ${slug}`);
      return new Response(JSON.stringify({ error: 'Smart link not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Render Smart Link] Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateHtmlResponse(smartLink: SmartLink): Response {
  console.log(`[Render Smart Link] Generating HTML response for: ${smartLink.title} by ${smartLink.artist_name}`);
  
  const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io';
  const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
  const description = smartLink.description || 
    `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
  const canonical = `${siteUrl}/link/${smartLink.id}`;

  // Make artwork URL absolute if it's not already
  const artworkUrl = smartLink.artwork_url.startsWith('http') 
    ? smartLink.artwork_url 
    : `${siteUrl}/_next/image?url=${encodeURIComponent(smartLink.artwork_url)}&w=760&q=75`;

  // Generate streamer buttons HTML
  const platformButtons = smartLink.platform_links?.map(platform => {
    const icon = platformIcons[platform.platform_id] || '';
    const actionText = ['itunes', 'beatport'].includes(platform.platform_id) ? 'Buy' : 'Play';
    
    return `
      <a 
        href="${platform.url}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="flex items-center justify-between w-full p-4 mb-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow"
        onclick="trackPlatformClick('${platform.id}')"
      >
        <div class="flex items-center">
          <img src="${icon}" alt="${platform.platform_name}" class="w-8 h-8 mr-3" loading="lazy" />
          <span class="font-medium">${platform.platform_name}</span>
        </div>
        <div class="flex items-center text-primary font-medium">
          ${actionText}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </a>
    `;
  }).join('') || '';

  // Generate schema markup for music
  const streamingPlatforms = smartLink.platform_links?.map(pl => ({
    name: pl.platform_name,
    url: pl.url
  })) || [];
  
  const musicSchema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": smartLink.title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": smartLink.artist_name,
      "@id": `${siteUrl}/artist/${encodeURIComponent(smartLink.artist_name)}`
    },
    "image": artworkUrl,
    "description": smartLink.description,
    ...(smartLink.release_date && { "datePublished": smartLink.release_date }),
    "url": canonical,
    "offers": streamingPlatforms.map(platform => ({
      "@type": "Offer",
      "url": platform.url,
      "availability": "https://schema.org/InStock",
      "category": "stream"
    }))
  };

  // Generate email capture form HTML if enabled
  const emailCaptureHtml = smartLink.email_capture_enabled ? `
    <div class="mt-6 p-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm">
      <h3 class="text-lg font-medium mb-2">${smartLink.email_capture_title || 'Join the Newsletter'}</h3>
      <p class="text-sm text-gray-600 mb-3">${smartLink.email_capture_description || 'Subscribe to stay updated with new releases and exclusive content.'}</p>
      <form id="emailSubscribeForm" class="space-y-3">
        <input type="hidden" name="smartLinkId" value="${smartLink.id}">
        <div>
          <input 
            type="email" 
            name="email" 
            placeholder="Your email address" 
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
        </div>
        <button 
          type="submit" 
          class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  ` : '';

  // Generate branding section
  const brandingHtml = !smartLink.profiles?.hide_branding ? `
    <div class="mt-8 text-center">
      <a 
        href="https://soundraiser.io" 
        target="_blank" 
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-white/60 hover:text-white/80 transition-colors group"
      >
        <img 
          src="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso%20D.svg"
          alt="Soundraiser"
          class="h-4 w-4 opacity-60 group-hover:opacity-80 transition-opacity"
          width="16"
          height="16"
        />
        <span class="text-sm">Powered by Soundraiser</span>
      </a>
    </div>
  ` : '';

  // Meta Pixel code for tracking if enabled
  const metaPixelCode = smartLink.meta_pixel_id ? `
    <!-- Meta Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s) {
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', '${smartLink.meta_pixel_id}');
        fbq('track', '${smartLink.meta_view_event || 'SmartLinkView'}');
    </script>
    <!-- End Meta Pixel Code -->
  ` : '';

  // Analytics tracking code
  const analyticsCode = `
    <script>
      // Simple page view tracking
      function trackPageView() {
        console.log('Tracking page view for: ${smartLink.id}');
        try {
          fetch('https://owtufhdsuuyrgmxytclj.supabase.co/rest/v1/link_views', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc'
            },
            body: JSON.stringify({
              smart_link_id: '${smartLink.id}',
              user_agent: navigator.userAgent
            })
          }).then(response => {
            console.log('Page view tracked:', response.status);
          }).catch(error => {
            console.error('Error tracking page view:', error);
          });
        } catch (e) {
          console.error('Error in tracking code:', e);
        }
      }

      // Platform click tracking
      function trackPlatformClick(platformLinkId) {
        console.log('Tracking platform click for ID:', platformLinkId);
        try {
          fetch('https://owtufhdsuuyrgmxytclj.supabase.co/rest/v1/platform_clicks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc'
            },
            body: JSON.stringify({
              platform_link_id: platformLinkId
            })
          }).then(response => {
            console.log('Platform click tracked:', response.status);
            
            // Also trigger Meta Pixel event if configured
            ${smartLink.meta_pixel_id ? `if (typeof fbq === 'function') {
              fbq('track', '${smartLink.meta_click_event || 'SmartLinkClick'}');
            }` : ''}
          }).catch(error => {
            console.error('Error tracking platform click:', error);
          });
        } catch (e) {
          console.error('Error in tracking code:', e);
        }
      }

      // Email subscription handling
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('emailSubscribeForm');
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = form.querySelector('input[name="email"]').value;
            const smartLinkId = form.querySelector('input[name="smartLinkId"]').value;
            
            fetch('https://owtufhdsuuyrgmxytclj.supabase.co/rest/v1/email_subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc'
              },
              body: JSON.stringify({
                email: email,
                smart_link_id: smartLinkId
              })
            }).then(response => {
              if (response.ok) {
                form.innerHTML = '<p class="text-green-600 font-medium py-2">Thanks for subscribing!</p>';
              } else {
                throw new Error('Subscription failed');
              }
            }).catch(error => {
              console.error('Error subscribing:', error);
              form.innerHTML += '<p class="text-red-500 text-sm mt-2">Something went wrong. Please try again.</p>';
            });
          });
        }
      });

      // Track page view when the page loads
      document.addEventListener('DOMContentLoaded', trackPageView);
    </script>
  `;

  // Define CSS for components - improved with critical CSS
  const inlineStyles = `
    <style>
      /* Base styles */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

      :root {
        --primary: #6851FB;
        --primary-hover: #4A47A5;
        --primary-light: #ECE9FF;
        --primary-disabled: #ECE9FF;
        --background: #FAFAFA;
        --foreground: #111827;
        --neutral-seasalt: #FAFAFA;
        --neutral-night: #0F0F0F;
        --neutral-border: #E6E6E6;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body, html {
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        background-color: var(--background);
        color: var(--foreground);
        min-height: 100vh;
        width: 100%;
        line-height: 1.5;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        font-weight: 600;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      /* Utility classes */
      .container {
        width: 100%;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .min-h-screen {
        min-height: 100vh;
      }

      .flex {
        display: flex;
      }

      .items-center {
        align-items: center;
      }

      .justify-center {
        justify-content: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .flex-col {
        flex-direction: column;
      }

      .relative {
        position: relative;
      }

      .absolute {
        position: absolute;
      }

      .inset-0 {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }

      .bg-cover {
        background-size: cover;
      }

      .bg-center {
        background-position: center;
      }

      .bg-no-repeat {
        background-repeat: no-repeat;
      }

      .rounded-xl {
        border-radius: 0.75rem;
      }

      .rounded-3xl {
        border-radius: 1.5rem;
      }

      .p-4 {
        padding: 1rem;
      }

      .p-6 {
        padding: 1.5rem;
      }

      .px-4 {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .py-2 {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      .py-8 {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }

      .mt-4 {
        margin-top: 1rem;
      }

      .mt-6 {
        margin-top: 1.5rem;
      }

      .mt-8 {
        margin-top: 2rem;
      }

      .mb-2 {
        margin-bottom: 0.5rem;
      }

      .mb-3 {
        margin-bottom: 0.75rem;
      }

      .mb-4 {
        margin-bottom: 1rem;
      }

      .mb-6 {
        margin-bottom: 1.5rem;
      }

      .mr-3 {
        margin-right: 0.75rem;
      }

      .ml-1 {
        margin-left: 0.25rem;
      }

      .w-full {
        width: 100%;
      }

      .max-w-md {
        max-width: 28rem;
      }

      .mx-auto {
        margin-left: auto;
        margin-right: auto;
      }

      .bg-white\\/95 {
        background-color: rgba(255, 255, 255, 0.95);
      }

      .backdrop-blur-sm {
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }

      .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }

      .shadow-md {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      .shadow-xl {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .text-center {
        text-align: center;
      }

      .text-primary {
        color: var(--primary);
      }

      .text-white {
        color: white;
      }

      .text-white\\/60 {
        color: rgba(255, 255, 255, 0.6);
      }

      .text-white\\/80 {
        color: rgba(255, 255, 255, 0.8);
      }

      .text-gray-600 {
        color: #4B5563;
      }

      .text-sm {
        font-size: 0.875rem;
      }

      .text-lg {
        font-size: 1.125rem;
      }

      .text-xl {
        font-size: 1.25rem;
      }

      .text-2xl {
        font-size: 1.5rem;
      }

      .font-medium {
        font-weight: 500;
      }

      .font-semibold {
        font-weight: 600;
      }

      .font-bold {
        font-weight: 700;
      }

      .z-10 {
        z-index: 10;
      }

      .space-y-3 > * + * {
        margin-top: 0.75rem;
      }

      .space-y-4 > * + * {
        margin-top: 1rem;
      }

      .gap-1\\.5 {
        gap: 0.375rem;
      }

      .inline-flex {
        display: inline-flex;
      }

      .h-4 {
        height: 1rem;
      }

      .w-4 {
        width: 1rem;
      }

      .h-5 {
        height: 1.25rem;
      }

      .w-5 {
        width: 1.25rem;
      }

      .h-8 {
        height: 2rem;
      }

      .w-8 {
        width: 2rem;
      }

      .h-48 {
        height: 12rem;
      }

      .w-48 {
        width: 12rem;
      }

      .object-cover {
        object-fit: cover;
      }

      .transition-colors {
        transition-property: color, background-color, border-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }

      .transition-opacity {
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }

      .transition-shadow {
        transition-property: box-shadow;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }

      .hover\\:shadow-md:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      .hover\\:text-white\\/80:hover {
        color: rgba(255, 255, 255, 0.8);
      }

      .hover\\:bg-primary\\/80:hover {
        background-color: rgba(104, 81, 251, 0.8);
      }

      .opacity-60 {
        opacity: 0.6;
      }

      .group:hover .group-hover\\:opacity-80 {
        opacity: 0.8;
      }

      .border {
        border-width: 1px;
      }

      .border-gray-300 {
        border-color: #D1D5DB;
      }

      .rounded-lg {
        border-radius: 0.5rem;
      }

      .focus\\:ring-2:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px var(--primary);
      }

      .focus\\:ring-primary:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px var(--primary);
      }

      .focus\\:border-transparent:focus {
        border-color: transparent;
      }

      .bg-primary {
        background-color: var(--primary);
      }

      .text-green-600 {
        color: #059669;
      }

      .text-red-500 {
        color: #EF4444;
      }

      .py-2 {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      .filter {
        filter: blur(30px) brightness(0.7);
      }

      .transform {
        transform: scale(1.1);
      }

      /* Mobile optimizations */
      @media (max-width: 640px) {
        .p-6 {
          padding: 1.25rem;
        }
        
        .h-48, .w-48 {
          height: 10rem;
          width: 10rem;
        }
        
        .text-2xl {
          font-size: 1.35rem;
        }
        
        .max-w-md {
          max-width: 90%;
          margin-left: auto;
          margin-right: auto;
        }
      }

      /* SVG Fix */
      svg {
        display: inline-block;
        vertical-align: middle;
      }

      /* Fix for blurry artwork */
      .artwork-image {
        -webkit-backface-visibility: hidden;
        -moz-backface-visibility: hidden;
        -webkit-transform: translate3d(0, 0, 0);
        -moz-transform: translate3d(0, 0, 0);
      }
      
      /* Prevent FOUC */
      .no-fouc {
        visibility: hidden;
      }
      .fouc-ready {
        visibility: visible;
      }
    </style>
  `;

  // Full HTML response
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="https://soundraiser.io/lovable-uploads/soundraiser-logo/Iso%20A%20fav.png" />
    
    <!-- SEO & Social Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Preload critical assets -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" as="style" />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" as="style" />
    <link rel="preload" href="${artworkUrl}" as="image" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${artworkUrl}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Soundraiser" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    ${smartLink.release_date ? `<meta property="music:release_date" content="${smartLink.release_date}" />` : ''}
    ${streamingPlatforms.map(platform => `<meta property="music:musician" content="${platform.url}" />`).join('\n    ')}

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${artworkUrl}" />

    <!-- Anti-FOUC script -->
    <script>
      // Add no-fouc class to prevent flash of unstyled content
      document.documentElement.classList.add('no-fouc');
      window.addEventListener('load', function() {
        document.documentElement.classList.remove('no-fouc');
        document.documentElement.classList.add('fouc-ready');
      });
    </script>

    <!-- Inline Styling (responsive, self-contained) -->
    ${inlineStyles}
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${JSON.stringify(musicSchema)}
    </script>
    
    <!-- Version Meta Tag -->
    <meta name="soundraiser:version" content="1.2.0" />
    <meta name="soundraiser:render-mode" content="edge-function" />
    <meta name="soundraiser:smart-link-id" content="${smartLink.id}" />
    <meta name="soundraiser:render-time" content="${new Date().toISOString()}" />
    
    ${metaPixelCode}
  </head>
  <body>
    <div class="relative min-h-screen flex flex-col items-center justify-center">
      <!-- Background blur effect -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image: url('${artworkUrl}'); filter: blur(30px) brightness(0.7); transform: scale(1.1);"
        aria-hidden="true"
      ></div>

      <!-- Content Container -->
      <div class="relative w-full max-w-md mx-auto px-4 py-8 z-10">
        <!-- Main Card -->
        <div class="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <!-- Header with artwork -->
          <div class="flex flex-col items-center mb-6">
            <img 
              src="${artworkUrl}" 
              alt="${smartLink.title}" 
              class="h-48 w-48 object-cover rounded-xl shadow-md mb-4 artwork-image"
              width="192"
              height="192"
            />
            <h1 class="text-xl md:text-2xl font-bold text-center">${smartLink.title}</h1>
            <p class="text-gray-600 text-lg text-center">${smartLink.artist_name}</p>
            ${smartLink.description ? `<p class="text-gray-500 text-sm text-center mt-2">${smartLink.description}</p>` : ''}
          </div>
          
          <!-- Platform Links -->
          <div class="space-y-4">
            ${platformButtons}
          </div>

          <!-- Email Capture Form (if enabled) -->
          ${emailCaptureHtml}
        </div>
        
        <!-- Branding Footer -->
        ${brandingHtml}
      </div>
    </div>

    <!-- Analytics & Tracking Code -->
    ${analyticsCode}
  </body>
</html>`;

  console.log(`[Render Smart Link] HTML response generated successfully`);

  // Enhanced headers to aid troubleshooting and caching
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Smart-Link-ID': smartLink.id,
    'X-Render-Source': 'Soundraiser Edge Function',
    'X-Is-Crawler': 'false', // Set dynamically in the main function based on user agent
    'X-Soundraiser-Version': '1.2.0', // Updated version for tracking response format changes
  };

  return new Response(html, { headers: responseHeaders });
}
