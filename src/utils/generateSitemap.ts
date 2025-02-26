
import { supabase } from "@/integrations/supabase/client";

// Define minimal types for what we need
type PostResult = { slug: string };
type LinkResult = { slug: string };

export async function generateSitemap() {
  try {
    // Fetch all published blog posts with explicit typing
    const { data: posts } = await supabase
      .from('blog_posts')
      .select<string, PostResult>('slug')
      .eq('status', 'published');

    // Fetch all public smart links with explicit typing
    const { data: links } = await supabase
      .from('smart_links')
      .select<string, LinkResult>('slug')
      .eq('status', 'active')
      .eq('is_private', false);

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
      ...(posts?.map(post => `${baseUrl}/blog/${post.slug}`) || []),
      ...(links?.map(link => `${baseUrl}/link/${link.slug}`) || [])
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
