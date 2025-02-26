
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { parseXml, serializeToString } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { DOMParser, XMLSerializer } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Read and parse the XSL template
const xslTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:template match="/">
    <html>
      <head>
        <title>Soundraiser XML Sitemap</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 75em; margin: 0 auto; padding: 2em; background: #f5f5f7; }
          table { width: 100%; border-collapse: collapse; margin: 1em 0; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th { background: #6851FB; color: white; text-align: left; padding: 1em; }
          td { padding: 1em; border-top: 1px solid #eee; }
          tr:hover td { background: #f7f7f7; }
          h1 { color: #6851FB; font-size: 24px; margin-bottom: 1em; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 2em; }
          .stat-card { background: white; padding: 1em; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-value { font-size: 24px; font-weight: bold; color: #6851FB; }
          .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
          a { color: #6851FB; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>
          <xsl:choose>
            <xsl:when test="sitemap:sitemapindex">Soundraiser XML Sitemap Index</xsl:when>
            <xsl:otherwise>Soundraiser XML Sitemap</xsl:otherwise>
          </xsl:choose>
        </h1>
        <xsl:apply-templates/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="sitemap:sitemapindex">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><xsl:value-of select="count(sitemap:sitemap)"/></div>
        <div class="stat-label">Total Sitemaps</div>
      </div>
    </div>
    <table>
      <tr>
        <th>Sitemap URL</th>
        <th>Last Modified</th>
      </tr>
      <xsl:for-each select="sitemap:sitemap">
        <tr>
          <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
          <td><xsl:value-of select="sitemap:lastmod"/></td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>

  <xsl:template match="sitemap:urlset">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><xsl:value-of select="count(sitemap:url)"/></div>
        <div class="stat-label">Total URLs</div>
      </div>
    </div>
    <table>
      <tr>
        <th>URL</th>
        <th>Last Modified</th>
        <th>Change Frequency</th>
        <th>Priority</th>
      </tr>
      <xsl:for-each select="sitemap:url">
        <tr>
          <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
          <td><xsl:value-of select="sitemap:lastmod"/></td>
          <td><xsl:value-of select="sitemap:changefreq"/></td>
          <td><xsl:value-of select="sitemap:priority"/></td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>
</xsl:stylesheet>`;

function transformXMLToHTML(xmlContent: string): string {
  const parser = new DOMParser();
  const xslDoc = parser.parseFromString(xslTemplate, "text/xml");
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  
  // Basic XSLT transformation simulation since Deno doesn't support full XSLT
  const isIndex = xmlDoc.documentElement.tagName === "sitemapindex";
  
  // Create the HTML structure
  let html = `<!DOCTYPE html>
<html>
  <head>
    <title>Soundraiser XML Sitemap</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 75em; margin: 0 auto; padding: 2em; background: #f5f5f7; }
      table { width: 100%; border-collapse: collapse; margin: 1em 0; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      th { background: #6851FB; color: white; text-align: left; padding: 1em; }
      td { padding: 1em; border-top: 1px solid #eee; }
      tr:hover td { background: #f7f7f7; }
      h1 { color: #6851FB; font-size: 24px; margin-bottom: 1em; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 2em; }
      .stat-card { background: white; padding: 1em; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .stat-value { font-size: 24px; font-weight: bold; color: #6851FB; }
      .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
      a { color: #6851FB; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>${isIndex ? 'Soundraiser XML Sitemap Index' : 'Soundraiser XML Sitemap'}</h1>`;

  if (isIndex) {
    const sitemaps = Array.from(xmlDoc.getElementsByTagName("sitemap"));
    html += `
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${sitemaps.length}</div>
        <div class="stat-label">Total Sitemaps</div>
      </div>
    </div>
    <table>
      <tr>
        <th>Sitemap URL</th>
        <th>Last Modified</th>
      </tr>`;

    sitemaps.forEach(sitemap => {
      const loc = sitemap.getElementsByTagName("loc")[0]?.textContent;
      const lastmod = sitemap.getElementsByTagName("lastmod")[0]?.textContent;
      html += `
      <tr>
        <td><a href="${loc}">${loc}</a></td>
        <td>${lastmod}</td>
      </tr>`;
    });
  } else {
    const urls = Array.from(xmlDoc.getElementsByTagName("url"));
    html += `
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${urls.length}</div>
        <div class="stat-label">Total URLs</div>
      </div>
    </div>
    <table>
      <tr>
        <th>URL</th>
        <th>Last Modified</th>
        <th>Change Frequency</th>
        <th>Priority</th>
      </tr>`;

    urls.forEach(url => {
      const loc = url.getElementsByTagName("loc")[0]?.textContent;
      const lastmod = url.getElementsByTagName("lastmod")[0]?.textContent;
      const changefreq = url.getElementsByTagName("changefreq")[0]?.textContent;
      const priority = url.getElementsByTagName("priority")[0]?.textContent;
      html += `
      <tr>
        <td><a href="${loc}">${loc}</a></td>
        <td>${lastmod}</td>
        <td>${changefreq}</td>
        <td>${priority}</td>
      </tr>`;
    });
  }

  html += `
    </table>
  </body>
</html>`;

  return html;
}

serve(async (req) => {
  console.log("Sitemap request received:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const segment = url.searchParams.get('segment');
    const format = url.searchParams.get('format') || 'html'; // Default to HTML
    
    console.log("Processing request:", { segment, format });

    // Get total URL count for pagination
    const { data: countResult, error: countError } = await supabase
      .rpc('get_sitemap_url_count')
      .maybeSingle();

    if (countError) {
      console.error("Error fetching URL count:", countError);
      throw new Error(`Failed to get URL count: ${countError.message}`);
    }

    const totalUrls = countResult?.total_urls || 0;
    const pageSize = 1000;
    const totalPages = Math.ceil(totalUrls / pageSize);
    
    console.log(`Total URLs: ${totalUrls}, Pages needed: ${totalPages}`);

    let xmlContent: string;

    // Generate main sitemap index
    if (!segment) {
      console.log("Generating main sitemap index...");
      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Array.from({ length: totalPages }, (_, i) => `
  <sitemap>
    <loc>https://soundraiser.io/sitemap-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;
    } else {
      // Extract page number from segment
      const pageNumber = parseInt(segment);
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
        throw new Error('Invalid sitemap segment');
      }

      console.log(`Generating sitemap page ${pageNumber}...`);
      
      const { data: urls, error: urlError } = await supabase
        .rpc('get_sitemap_urls_paginated', {
          p_offset: (pageNumber - 1) * pageSize,
          p_limit: pageSize
        });

      if (urlError) {
        console.error("Error fetching URLs:", urlError);
        throw new Error(`Failed to fetch URLs: ${urlError.message}`);
      }

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>https://soundraiser.io${url.url}</loc>
    <lastmod>${new Date(url.updated_at).toISOString()}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;
    }

    // Transform to HTML if requested
    if (format === 'html') {
      console.log("Transforming XML to HTML...");
      const html = transformXMLToHTML(xmlContent);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }

    // Return raw XML
    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error("Error in sitemap generation:", error);
    const errorContent = format === 'html' 
      ? `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error: ${error.message} -->
</urlset>`;
    
    return new Response(errorContent, { 
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': format === 'html' ? 'text/html' : 'application/xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
});
