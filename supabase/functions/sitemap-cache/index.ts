import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'get'
    const key = url.searchParams.get('key')
    
    console.log(`Sitemap cache ${action} request: ${key || 'all'}`)
    
    // GET: Retrieve cached sitemap
    if (action === 'get' && key) {
      const { data, error } = await supabase
        .from('sitemap_cache')
        .select('content, created_at')
        .eq('key', key)
        .single()
      
      if (error) {
        console.error('Error fetching sitemap cache:', error)
        return new Response(JSON.stringify({
          success: false,
          message: 'Cache miss or error',
          error: error.message
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
      
      // Check if cache entry exists and is not expired
      if (data) {
        const MAX_AGE = 86400 * 7 // 7 days in seconds
        const createdAt = new Date(data.created_at)
        const now = new Date()
        const age = (now.getTime() - createdAt.getTime()) / 1000 // in seconds
        
        if (age < MAX_AGE) {
          console.log(`Cache hit for ${key}, age: ${Math.round(age / 3600)} hours`)
          
          // If content is XML and requested as XML, return as XML
          if (req.headers.get('Accept')?.includes('application/xml') && data.content.trim().startsWith('<?xml')) {
            return new Response(data.content, {
              headers: {
                'Content-Type': 'application/xml; charset=UTF-8',
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                ...corsHeaders
              }
            })
          }
          
          // Otherwise return JSON with the content
          return new Response(JSON.stringify({
            success: true,
            data: {
              content: data.content,
              created_at: data.created_at
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          })
        } else {
          console.log(`Cache expired for ${key}, age: ${Math.round(age / 3600)} hours`)
        }
      } else {
        console.log(`Cache miss for ${key}`)
      }
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Cache miss or expired'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
    
    // SET: Create or update cache entry
    if (action === 'set' && key && req.method === 'POST') {
      try {
        const { content, ttl } = await req.json()
        
        if (!content) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Content is required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          })
        }
        
        // Store in cache
        const { data, error } = await supabase
          .from('sitemap_cache')
          .upsert({
            key,
            content,
            ttl: ttl || 86400 // Default 1 day in seconds
          })
          .select()
        
        if (error) {
          throw new Error(`Failed to cache sitemap: ${error.message}`)
        }
        
        console.log(`Cache set for ${key}`)
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Cached successfully',
          data: data?.[0]
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      } catch (error) {
        console.error('Error setting cache:', error)
        return new Response(JSON.stringify({
          success: false,
          message: `Error caching sitemap: ${error.message}`
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
    }
    
    // DELETE: Clear cache entries
    if (action === 'delete') {
      const { error } = await supabase
        .from('sitemap_cache')
        .delete()
        .eq(key ? 'key' : 'id', key || 0) // If key is provided, delete specific entry, else delete all
      
      if (error) {
        throw new Error(`Failed to clear cache: ${error.message}`)
      }
      
      console.log(`Cache ${key ? 'entry deleted' : 'cleared'}: ${key || 'all'}`)
      
      return new Response(JSON.stringify({
        success: true,
        message: key ? `Cache entry ${key} deleted` : 'All cache entries cleared'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid action'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Cache error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
