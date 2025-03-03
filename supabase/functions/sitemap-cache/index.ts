
import { corsHeaders, xmlResponse, xmlErrorResponse, createAdminClient, generateETag } from '../_shared/sitemap-utils.ts';

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing authorization header'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Initialize Supabase client with admin access
    const supabase = createAdminClient();
    
    // Parse request to identify the operation
    const url = new URL(req.url);
    const operation = url.searchParams.get('operation') || 'status';
    
    // GET request: retrieve cache status
    if (req.method === 'GET') {
      if (operation === 'status') {
        const { data, error } = await supabase
          .from('sitemap_cache')
          .select('key, updated_at')
          .order('updated_at', { ascending: false });
        
        if (error) {
          throw new Error(`Failed to get cache status: ${error.message}`);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sitemap cache status retrieved',
            data: {
              count: data?.length || 0,
              files: data || [],
              last_updated: data?.length ? data[0].updated_at : null
            }
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Operation not recognized
      return new Response(
        JSON.stringify({
          success: false,
          message: `Operation '${operation}' not recognized`
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // POST request: perform an action on the cache
    else if (req.method === 'POST') {
      const body = await req.json();
      
      // Operation: purge
      if (operation === 'purge') {
        if (body.key) {
          // Delete a specific cache entry
          const { error } = await supabase
            .from('sitemap_cache')
            .delete()
            .eq('key', body.key);
          
          if (error) {
            throw new Error(`Failed to purge cache entry: ${error.message}`);
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: `Cache entry '${body.key}' purged`,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        } else {
          // Delete all cache entries
          const { error } = await supabase
            .from('sitemap_cache')
            .delete()
            .neq('key', 'non-existent-key'); // Delete all rows
          
          if (error) {
            throw new Error(`Failed to purge all cache entries: ${error.message}`);
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'All cache entries purged',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }
      }
      
      // Operation: add
      else if (operation === 'add') {
        if (!body.key || !body.content) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Missing required fields 'key' and 'content'"
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }
        
        // Generate ETag
        const etag = await generateETag(body.content);
        
        // Insert or update cache entry
        const { error } = await supabase
          .from('sitemap_cache')
          .upsert({
            key: body.key,
            content: body.content,
            etag,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });
        
        if (error) {
          throw new Error(`Failed to add cache entry: ${error.message}`);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Cache entry '${body.key}' added/updated`,
            etag
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Operation not recognized
      return new Response(
        JSON.stringify({
          success: false,
          message: `Operation '${operation}' not recognized`
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({
        success: false,
        message: `Method '${req.method}' not allowed`
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    console.error(`Error in sitemap-cache: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error in sitemap-cache: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};
