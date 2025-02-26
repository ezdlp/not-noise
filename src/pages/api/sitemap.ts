
import { supabase } from "@/integrations/supabase/client";

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    const { data, error } = await supabase.functions.invoke('sitemap');
    
    if (error) {
      throw error;
    }

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
