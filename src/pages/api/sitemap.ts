
import { generateSitemap } from "@/utils/generateSitemap";

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    const sitemap = await generateSitemap();
    
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
