
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

const platformIcons: { [key: string]: string } = {
  spotify: "/lovable-uploads/spotify.png",
  apple_music: "/lovable-uploads/applemusic.png",
  youtube_music: "/lovable-uploads/youtubemusic.png",
  youtube: "/lovable-uploads/youtube.png",
  amazon_music: "/lovable-uploads/amazonmusic.png",
  deezer: "/lovable-uploads/deezer.png",
  soundcloud: "/lovable-uploads/soundcloud.png",
  itunes: "/lovable-uploads/itunes.png",
  tidal: "/lovable-uploads/tidal.png",
  anghami: "/lovable-uploads/anghami.png",
  napster: "/lovable-uploads/napster.png",
  boomplay: "/lovable-uploads/boomplay.png",
  yandex: "/lovable-uploads/yandex.png",
  beatport: "/lovable-uploads/beatport.png",
  bandcamp: "/lovable-uploads/bandcamp.png",
  audius: "/lovable-uploads/audius.png",
  youtubeMusic: "/lovable-uploads/youtubemusic.png",
  appleMusic: "/lovable-uploads/applemusic.png",
  amazonMusic: "/lovable-uploads/amazonmusic.png"
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
          <img src="${icon}" alt="${platform.platform_name}" class="w-8 h-8 mr-3" />
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
    "image": smartLink.artwork_url,
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
          src="/lovable-uploads/soundraiser-logo/Iso D.svg"
          alt="Soundraiser"
          class="h-4 w-4 opacity-60 group-hover:opacity-80 transition-opacity"
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

  // Full HTML response
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/lovable-uploads/soundraiser-logo/Iso A fav.png" />
    
    <!-- SEO & Social Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${smartLink.artwork_url}" />
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
    <meta name="twitter:image" content="${smartLink.artwork_url}" />

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6851FB',
              primaryDark: '#4A47A5',
              primaryLight: '#ECE9FF',
              neutral: {
                seasalt: '#FAFAFA'
              }
            }
          }
        }
      }
    </script>
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${JSON.stringify(musicSchema)}
    </script>
    
    <!-- Debugging Meta Tags -->
    <meta name="soundraiser:version" content="1.0.5" />
    <meta name="soundraiser:render-mode" content="edge-function" />
    <meta name="soundraiser:smart-link-id" content="${smartLink.id}" />
    <meta name="soundraiser:render-time" content="${new Date().toISOString()}" />
    
    ${metaPixelCode}
  </head>
  <body class="min-h-screen">
    <div class="relative min-h-screen flex flex-col items-center justify-center">
      <!-- Background blur effect -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image: url(${smartLink.artwork_url}); filter: blur(30px) brightness(0.7); transform: scale(1.1);"
      ></div>

      <!-- Content Container -->
      <div class="relative w-full max-w-md mx-auto px-4 py-8 z-10">
        <!-- Main Card -->
        <div class="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <!-- Header with artwork -->
          <div class="flex flex-col items-center mb-6">
            <img 
              src="${smartLink.artwork_url}" 
              alt="${smartLink.title}" 
              class="w-48 h-48 md:w-64 md:h-64 object-cover rounded-xl shadow-md mb-4"
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
    'X-Soundraiser-Version': '1.0.5', // Updated version for tracking response format changes
  };

  return new Response(html, { headers: responseHeaders });
}
