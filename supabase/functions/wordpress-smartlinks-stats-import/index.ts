
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ImportStats {
  total: number;
  success: number;
  errors: { link: string; error: string }[];
  unimported: string[];
}

function extractCDATAContent(value: any): string {
  if (!value) return '';
  
  if (typeof value === 'string') return value;
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const firstItem = value[0];
    
    if (typeof firstItem === 'object') {
      if (firstItem['#cdata']) return firstItem['#cdata'];
      if (firstItem['#text']) return firstItem['#text'];
      return firstItem;
    }
    
    return firstItem;
  }
  
  if (typeof value === 'object') {
    if (value['#cdata']) return value['#cdata'];
    if (value['#text']) return value['#text'];
    if (value.toString) return value.toString();
  }
  
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const testMode = formData.get('testMode') === 'true';
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    // Log initial memory usage
    const startMemory = Deno.memoryUsage();
    console.log('Initial memory usage:', {
      heapUsed: startMemory.heapUsed / 1024 / 1024 + ' MB',
      heapTotal: startMemory.heapTotal / 1024 / 1024 + ' MB',
    });

    const text = await file.text();
    const xmlDoc = parse(text);

    if (!xmlDoc || !xmlDoc.rss || !xmlDoc.rss.channel) {
      throw new Error('Invalid XML file structure');
    }

    const items = xmlDoc.rss.channel.item || [];
    const maxItems = testMode ? Math.min(10, items.length) : items.length;
    console.log(`Processing ${maxItems} items`);

    const results: ImportStats = {
      total: maxItems,
      success: 0,
      errors: [],
      unimported: []
    };

    // Process items in smaller batches
    const batchSize = 5;
    for (let i = 0; i < maxItems; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, maxItems);
      const batch = items.slice(i, batchEnd);
      
      for (const item of batch) {
        try {
          const wpPostId = extractCDATAContent(item['wp:post_id']);
          if (!wpPostId) {
            throw new Error('Missing WordPress post ID');
          }

          // Find corresponding smart link from import logs
          const { data: importLog, error: importError } = await supabaseAdmin
            .from('import_logs')
            .select('smart_link_id, created_at')
            .eq('wp_post_id', wpPostId)
            .single();

          if (importError || !importLog?.smart_link_id) {
            results.unimported.push(`Post ID: ${wpPostId} - No matching smart link found`);
            continue;
          }

          // Extract views and clicks from meta
          let views = 0;
          let clicks = 0;
          const metas = item['wp:postmeta'] || [];
          
          for (const meta of metas) {
            const key = extractCDATAContent(meta['wp:meta_key']);
            const value = extractCDATAContent(meta['wp:meta_value']);

            if (key === '_link_views') {
              views = parseInt(value) || 0;
            } else if (key === '_link_clicks') {
              clicks = parseInt(value) || 0;
            }
          }

          // Get platform links for this smart link
          const { data: platformLinks, error: platformError } = await supabaseAdmin
            .from('platform_links')
            .select('id')
            .eq('smart_link_id', importLog.smart_link_id);

          if (platformError) {
            throw new Error(`Failed to fetch platform links: ${platformError.message}`);
          }

          // Calculate time range for spreading stats
          const createdAt = new Date(importLog.created_at);
          const now = new Date();
          const timeRange = now.getTime() - createdAt.getTime();

          // Create view records
          if (views > 0) {
            const viewRecords = Array.from({ length: views }).map(() => {
              const randomOffset = Math.random() * timeRange;
              const viewedAt = new Date(createdAt.getTime() + randomOffset);
              
              return {
                smart_link_id: importLog.smart_link_id,
                viewed_at: viewedAt.toISOString()
              };
            });

            const { error: viewsError } = await supabaseAdmin
              .from('link_views')
              .insert(viewRecords);

            if (viewsError) {
              throw new Error(`Failed to insert views: ${viewsError.message}`);
            }
          }

          // Create click records distributed across platforms
          if (clicks > 0 && platformLinks && platformLinks.length > 0) {
            const clicksPerPlatform = Math.ceil(clicks / platformLinks.length);
            const clickRecords = [];

            for (const platform of platformLinks) {
              for (let j = 0; j < clicksPerPlatform; j++) {
                const randomOffset = Math.random() * timeRange;
                const clickedAt = new Date(createdAt.getTime() + randomOffset);
                
                clickRecords.push({
                  platform_link_id: platform.id,
                  clicked_at: clickedAt.toISOString()
                });
              }
            }

            const { error: clicksError } = await supabaseAdmin
              .from('platform_clicks')
              .insert(clickRecords);

            if (clicksError) {
              throw new Error(`Failed to insert clicks: ${clicksError.message}`);
            }
          }

          // Update import log to mark stats as imported
          const { error: updateError } = await supabaseAdmin
            .from('import_logs')
            .update({
              stats_imported_at: new Date().toISOString(),
              wp_views: views,
              wp_clicks: clicks
            })
            .eq('wp_post_id', wpPostId);

          if (updateError) {
            throw new Error(`Failed to update import log: ${updateError.message}`);
          }

          results.success++;
        } catch (error) {
          console.error('Error processing item:', error);
          results.errors.push({
            link: extractCDATAContent(item.title) || 'Unknown',
            error: error.message
          });
        }
      }

      // Log memory usage every batch
      const currentMemory = Deno.memoryUsage();
      console.log('Current memory usage:', {
        heapUsed: currentMemory.heapUsed / 1024 / 1024 + ' MB',
        heapTotal: currentMemory.heapTotal / 1024 / 1024 + ' MB',
        processed: i + batchSize,
        total: maxItems
      });

      // Give time for GC between batches
      await delay(100);
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing stats import:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
