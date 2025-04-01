
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/deploy_api
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Log all headers for debugging
  const userAgent = req.headers.get('user-agent') || 'No User-Agent'
  console.log(`Received meta request with User-Agent: ${userAgent}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Get the slug from the URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]

    console.log(`Processing meta request for smart link: ${slug}`)

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing slug parameter' }), { 
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Fetch the smart link data from Supabase
    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select('id, title, artist_name, description, artwork_url, release_date')
      .eq('slug', slug)
      .maybeSingle()

    // If no results from slug, try with ID as fallback
    let finalSmartLink = smartLink
    if (!smartLink && !error) {
      const { data: idData, error: idError } = await supabase
        .from('smart_links')
        .select('id, title, artist_name, description, artwork_url, release_date')
        .eq('id', slug)
        .maybeSingle()

      if (idError) {
        console.error('Error fetching smart link by ID:', idError)
        return new Response(JSON.stringify({ error: 'Not found' }), { 
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }

      finalSmartLink = idData
    } else if (error) {
      console.error('Error fetching smart link:', error)
      return new Response(JSON.stringify({ error: 'Server error' }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    if (!finalSmartLink) {
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Track the view in analytics (optional)
    try {
      await supabase.from('link_views').insert({
        smart_link_id: finalSmartLink.id,
        user_agent: userAgent,
      })
    } catch (analyticsError) {
      console.error('Failed to track analytics:', analyticsError)
      // Continue even if analytics fails
    }

    console.log(`Successfully generated meta for ${slug}`)

    // Return just the metadata as JSON with proper caching headers
    return new Response(JSON.stringify({
      title: finalSmartLink.title,
      artistName: finalSmartLink.artist_name,
      description: finalSmartLink.description,
      artworkUrl: finalSmartLink.artwork_url,
      releaseDate: finalSmartLink.release_date,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error in smart-link-meta function:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
