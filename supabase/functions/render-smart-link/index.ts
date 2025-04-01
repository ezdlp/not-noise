
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
  spotify: "https://soundraiser.io/lovable-uploads/spotify.png",
  apple_music: "https://soundraiser.io/lovable-uploads/applemusic.png",
  youtube_music: "https://soundraiser.io/lovable-uploads/youtubemusic.png",
  youtube: "https://soundraiser.io/lovable-uploads/youtube.png",
  amazon_music: "https://soundraiser.io/lovable-uploads/amazonmusic.png",
  deezer: "https://soundraiser.io/lovable-uploads/deezer.png",
  soundcloud: "https://soundraiser.io/lovable-uploads/soundcloud.png",
  itunes: "https://soundraiser.io/lovable-uploads/itunes.png",
  tidal: "https://soundraiser.io/lovable-uploads/tidal.png",
  anghami: "https://soundraiser.io/lovable-uploads/anghami.png",
  napster: "https://soundraiser.io/lovable-uploads/napster.png",
  boomplay: "https://soundraiser.io/lovable-uploads/boomplay.png",
  yandex: "https://soundraiser.io/lovable-uploads/yandex.png",
  beatport: "https://soundraiser.io/lovable-uploads/beatport.png",
  bandcamp: "https://soundraiser.io/lovable-uploads/bandcamp.png",
  audius: "https://soundraiser.io/lovable-uploads/audius.png",
  youtubeMusic: "https://soundraiser.io/lovable-uploads/youtubemusic.png",
  appleMusic: "https://soundraiser.io/lovable-uploads/applemusic.png",
  amazonMusic: "https://soundraiser.io/lovable-uploads/amazonmusic.png"
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
  
  try {
    const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io';
    const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
    const canonical = `${siteUrl}/link/${smartLink.id}`;

    // Make artwork URL absolute if it's not already
    let artworkUrl = '';
    try {
      if (smartLink.artwork_url) {
        artworkUrl = smartLink.artwork_url.startsWith('http') 
          ? smartLink.artwork_url 
          : `${siteUrl}${smartLink.artwork_url}`;
      } else {
        artworkUrl = `${siteUrl}/lovable-uploads/soundraiser-logo/Logo%20A.svg`;
      }
    } catch (error) {
      console.error(`[Render Smart Link] Error processing artwork URL: ${error}`);
      artworkUrl = `${siteUrl}/lovable-uploads/soundraiser-logo/Logo%20A.svg`;
    }

    // Generate platform buttons HTML
    let platformButtons = '';
    try {
      platformButtons = smartLink.platform_links?.map(platform => {
        let iconUrl = '';
        try {
          iconUrl = platformIcons[platform.platform_id] || `${siteUrl}/lovable-uploads/default-platform.png`;
        } catch (error) {
          console.error(`[Render Smart Link] Error getting platform icon for ${platform.platform_id}: ${error}`);
          iconUrl = `${siteUrl}/lovable-uploads/default-platform.png`;
        }
        
        const actionText = ['itunes', 'beatport'].includes(platform.platform_id) ? 'Buy' : 'Play';
        
        return `
          <a 
            href="${platform.url}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="platform-button"
            onclick="trackPlatformClick('${platform.id}')"
          >
            <div class="platform-info">
              <img src="${iconUrl}" alt="${platform.platform_name}" class="platform-icon" loading="lazy" />
              <span class="platform-name">${platform.platform_name}</span>
            </div>
            <div class="platform-action">
              ${actionText}
              <svg xmlns="http://www.w3.org/2000/svg" class="platform-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </a>
        `;
      }).join('') || '';
    } catch (error) {
      console.error(`[Render Smart Link] Error generating platform buttons: ${error}`);
      platformButtons = `<p class="error-message">Could not load streaming platforms. Please try again later.</p>`;
    }

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
    let emailCaptureHtml = '';
    try {
      emailCaptureHtml = smartLink.email_capture_enabled ? `
        <div class="email-form">
          <h3 class="email-title">${smartLink.email_capture_title || 'Join the Newsletter'}</h3>
          <p class="email-description">${smartLink.email_capture_description || 'Subscribe to stay updated with new releases and exclusive content.'}</p>
          <form id="emailSubscribeForm" class="email-subscribe-form">
            <input type="hidden" name="smartLinkId" value="${smartLink.id}">
            <div>
              <input 
                type="email" 
                name="email" 
                placeholder="Your email address" 
                required
                class="email-input"
              >
            </div>
            <button 
              type="submit" 
              class="subscribe-button"
            >
              Subscribe
            </button>
          </form>
        </div>
      ` : '';
    } catch (error) {
      console.error(`[Render Smart Link] Error generating email form: ${error}`);
      emailCaptureHtml = '';
    }

    // Generate branding section
    let brandingHtml = '';
    try {
      brandingHtml = !smartLink.profiles?.hide_branding ? `
        <div class="branding">
          <a 
            href="https://soundraiser.io" 
            target="_blank" 
            rel="noopener noreferrer"
            class="branding-link"
          >
            <img 
              src="${siteUrl}/lovable-uploads/soundraiser-logo/Iso%20D.svg"
              alt="Soundraiser"
              class="branding-logo"
              width="16"
              height="16"
            />
            <span class="branding-text">Powered by Soundraiser</span>
          </a>
        </div>
      ` : '';
    } catch (error) {
      console.error(`[Render Smart Link] Error generating branding: ${error}`);
      brandingHtml = '';
    }

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
                  form.innerHTML = '<p class="success-message">Thanks for subscribing!</p>';
                } else {
                  throw new Error('Subscription failed');
                }
              }).catch(error => {
                console.error('Error subscribing:', error);
                form.innerHTML += '<p class="error-message">Something went wrong. Please try again.</p>';
              });
            });
          }
        });

        // Track page view when the page loads
        document.addEventListener('DOMContentLoaded', trackPageView);
      </script>
    `;

    // Define CSS styles
    const inlineStyles = `
      <style>
        /* Reset and base styles */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body, html {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #FAFAFA;
          color: #111827;
          min-height: 100vh;
          width: 100%;
          line-height: 1.5;
          font-size: 16px;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        a {
          color: inherit;
          text-decoration: none;
        }
        
        /* Main container */
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        
        /* Blurred background */
        .background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          filter: blur(30px) brightness(0.7);
          transform: scale(1.1);
          z-index: -1;
        }
        
        /* Content wrapper */
        .content-wrapper {
          width: 100%;
          max-width: 450px;
          margin: 20px;
          padding: 20px 0;
          position: relative;
          z-index: 2;
        }
        
        /* Main card */
        .card {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
        }
        
        /* Header section */
        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .artwork {
          width: 192px;
          height: 192px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-bottom: 16px;
        }
        
        .title {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          font-size: 24px;
          margin-bottom: 4px;
          color: #111827;
        }
        
        .artist {
          font-size: 18px;
          color: #4B5563;
          margin-bottom: 8px;
        }
        
        .description {
          font-size: 14px;
          color: #6B7280;
        }
        
        /* Platform buttons */
        .platform-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px;
          margin-bottom: 12px;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        
        .platform-button:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .platform-info {
          display: flex;
          align-items: center;
        }
        
        .platform-icon {
          width: 32px;
          height: 32px;
          margin-right: 12px;
          border-radius: 4px;
        }
        
        .platform-name {
          font-weight: 500;
        }
        
        .platform-action {
          display: flex;
          align-items: center;
          color: #6851FB;
          font-weight: 500;
        }
        
        .platform-arrow {
          width: 20px;
          height: 20px;
          margin-left: 4px;
        }
        
        /* Email subscription */
        .email-form {
          margin-top: 24px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .email-title {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #111827;
        }
        
        .email-description {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 12px;
        }
        
        .email-subscribe-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .email-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .email-input:focus {
          border-color: #6851FB;
          box-shadow: 0 0 0 2px rgba(104, 81, 251, 0.2);
        }
        
        .subscribe-button {
          width: 100%;
          padding: 10px 16px;
          background-color: #6851FB;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .subscribe-button:hover {
          background-color: #5941e2;
        }
        
        /* Branding footer */
        .branding {
          margin-top: 32px;
          text-align: center;
        }
        
        .branding-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.2s;
        }
        
        .branding-link:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .branding-logo {
          opacity: 0.6;
          transition: opacity 0.2s;
          width: 16px;
          height: 16px;
        }
        
        .branding-link:hover .branding-logo {
          opacity: 0.8;
        }
        
        .branding-text {
          font-size: 14px;
        }
        
        /* Messages */
        .success-message {
          color: #059669;
          font-weight: 500;
          padding: 8px 0;
          text-align: center;
        }
        
        .error-message {
          color: #EF4444;
          font-size: 14px;
          padding: 8px 0;
          text-align: center;
        }
        
        /* Mobile optimizations */
        @media (max-width: 480px) {
          .content-wrapper {
            padding: 16px 0;
          }
          
          .card {
            padding: 20px;
            border-radius: 20px;
          }
          
          .artwork {
            width: 160px;
            height: 160px;
          }
          
          .title {
            font-size: 22px;
          }
          
          .artist {
            font-size: 16px;
          }
          
          .platform-button {
            padding: 14px;
          }
          
          .platform-icon {
            width: 28px;
            height: 28px;
          }
        }
        
        /* Anti-flickering */
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
    <link rel="icon" type="image/png" href="${siteUrl}/lovable-uploads/soundraiser-logo/Iso%20A%20fav.png" />
    
    <!-- SEO & Social Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Preload critical assets -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" as="style" />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" as="style" />
    <link rel="preload" href="${artworkUrl}" as="image" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" />
    
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
    <meta name="soundraiser:version" content="1.3.0" />
    <meta name="soundraiser:render-mode" content="edge-function" />
    <meta name="soundraiser:smart-link-id" content="${smartLink.id}" />
    <meta name="soundraiser:render-time" content="${new Date().toISOString()}" />
    
    ${metaPixelCode}
  </head>
  <body>
    <div class="page-container">
      <!-- Background blur effect -->
      <div 
        class="background"
        style="background-image: url('${artworkUrl}');"
        aria-hidden="true"
      ></div>

      <!-- Content Container -->
      <div class="content-wrapper">
        <!-- Main Card -->
        <div class="card">
          <!-- Header with artwork -->
          <div class="header">
            <img 
              src="${artworkUrl}" 
              alt="${smartLink.title}" 
              class="artwork"
              width="192"
              height="192"
              loading="eager"
            />
            <h1 class="title">${smartLink.title}</h1>
            <p class="artist">${smartLink.artist_name}</p>
            ${smartLink.description ? `<p class="description">${smartLink.description}</p>` : ''}
          </div>
          
          <!-- Platform Links -->
          <div class="platforms">
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
      'X-Is-Crawler': isCrawler ? 'true' : 'false',
      'X-Soundraiser-Version': '1.3.0',
    };

    return new Response(html, { headers: responseHeaders });
  } catch (error) {
    console.error(`[Render Smart Link] Error in generateHtmlResponse: ${error instanceof Error ? error.message : String(error)}`);
    
    // Provide a simple fallback response
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Listen to Music | Soundraiser</title>
    <style>
      body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f7f7f7; }
      .error-container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 90%; width: 450px; }
      h1 { margin-top: 0; color: #333; }
      p { color: #666; line-height: 1.5; }
      a { color: #6851FB; text-decoration: none; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="error-container">
      <h1>Sorry, we couldn't load this music link</h1>
      <p>Please try again later or visit <a href="https://soundraiser.io">Soundraiser</a> to discover more music.</p>
    </div>
  </body>
</html>`;

    return new Response(fallbackHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}
