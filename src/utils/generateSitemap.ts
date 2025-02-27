
import fs from 'fs';
import path from 'path';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a sitemap.xml file and saves it to the public directory
 */
export async function generateSitemap() {
  try {
    console.log('Starting sitemap generation...');
    
    // Initialize the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

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

    console.log(`Adding ${staticPages.length} static pages to sitemap`);

    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>https://soundraiser.io${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add smart links
    try {
      console.log('Fetching smart links for sitemap...');
      const { data: smartLinks, error: smartLinksError } = await supabase
        .from('smart_links')
        .select('slug, updated_at')
        .not('slug', 'is', null);

      if (smartLinksError) {
        console.error('Error fetching smart links:', smartLinksError);
      } else if (smartLinks && smartLinks.length > 0) {
        console.log(`Adding ${smartLinks.length} smart links to sitemap`);
        
        smartLinks.forEach(link => {
          sitemap += `
  <url>
    <loc>https://soundraiser.io/link/${link.slug}</loc>
    <lastmod>${new Date(link.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });
      }
    } catch (error) {
      console.error('Error processing smart links for sitemap:', error);
    }

    // Add blog posts
    try {
      console.log('Fetching blog posts for sitemap...');
      const { data: blogPosts, error: blogPostsError } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .eq('visibility', 'public');

      if (blogPostsError) {
        console.error('Error fetching blog posts:', blogPostsError);
      } else if (blogPosts && blogPosts.length > 0) {
        console.log(`Adding ${blogPosts.length} blog posts to sitemap`);
        
        blogPosts.forEach(post => {
          const updateDate = post.updated_at || post.published_at || new Date().toISOString();
          sitemap += `
  <url>
    <loc>https://soundraiser.io/${post.slug}</loc>
    <lastmod>${new Date(updateDate).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
      }
    } catch (error) {
      console.error('Error processing blog posts for sitemap:', error);
    }

    // Close the sitemap
    sitemap += `
</urlset>`;

    // Ensure the public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write the sitemap to the public directory
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully and saved to public/sitemap.xml');
    
    return { success: true };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return { success: false, error };
  }
}
