
import { supabase } from "@/integrations/supabase/client";

// Define simple interface for query results
interface SimpleRow {
  slug: string | null;
}

export async function generateSitemap() {
  try {
    // Fetch all published blog posts
    const posts = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published')
      .then(({ data }) => (data || []) as SimpleRow[]);

    // Fetch all public smart links
    const links = await supabase
      .from('smart_links')
      .select('slug')
      .eq('status', 'active')
      .eq('is_private', false)
      .then(({ data }) => (data || []) as SimpleRow[]);

    // Define static routes
    const staticUrls = [
      "",  // home page
      "/blog",
      "/pricing",
      "/spotify-playlist-promotion",
      "/streaming-calculator"
    ];

    // Base URL from environment or default
    const baseUrl = "https://soundraiser.io";

    // Combine all URLs
    const urls = [
      ...staticUrls.map(path => `${baseUrl}${path}`),
      ...posts.filter(post => post.slug).map(post => `${baseUrl}/blog/${post.slug}`),
      ...links.filter(link => link.slug).map(link => `${baseUrl}/link/${link.slug}`)
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}
