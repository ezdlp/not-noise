
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set appropriate headers for XML content
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    // Generate basic sitemap with static pages
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
      { url: '/spotify-playlist-promotion', priority: '0.9', changefreq: 'weekly' },
      { url: '/spotify-royalty-calculator', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/help', priority: '0.7', changefreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>https://soundraiser.io${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add smart links
    try {
      const { data: smartLinks, error: smartLinksError } = await supabase
        .from('smart_links')
        .select('slug, updated_at')
        .not('slug', 'is', null);

      if (smartLinksError) {
        console.error('Error fetching smart links:', smartLinksError);
      } else if (smartLinks && smartLinks.length > 0) {
        smartLinks.forEach(link => {
          sitemap += `  <url>
    <loc>https://soundraiser.io/link/${link.slug}</loc>
    <lastmod>${new Date(link.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        });
      }
    } catch (smartLinksError) {
      console.error('Error processing smart links:', smartLinksError);
      // Continue without smart links
    }

    // Add blog posts
    try {
      const { data: blogPosts, error: blogPostsError } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .eq('visibility', 'public');

      if (blogPostsError) {
        console.error('Error fetching blog posts:', blogPostsError);
      } else if (blogPosts && blogPosts.length > 0) {
        blogPosts.forEach(post => {
          const updateDate = post.updated_at || post.published_at || new Date().toISOString();
          sitemap += `  <url>
    <loc>https://soundraiser.io/${post.slug}</loc>
    <lastmod>${new Date(updateDate).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        });
      }
    } catch (blogPostsError) {
      console.error('Error processing blog posts:', blogPostsError);
      // Continue without blog posts
    }

    // Close sitemap
    sitemap += `</urlset>`;
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Unexpected error in sitemap API route:', error);
    
    // Return a basic sitemap with just the homepage in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return res.status(200).send(fallbackSitemap);
  }
}
