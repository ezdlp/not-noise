
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for retrieving analytics metrics and aggregated data
 */
class MetricsService {
  /**
   * Get total view count for a smart link
   */
  async getSmartLinkViewCount(smartLinkId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('platform_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('smart_link_id', smartLinkId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting smart link view count:', error);
      return 0;
    }
  }

  /**
   * Get platform click metrics for a smart link
   */
  async getPlatformClicksBySmartLink(smartLinkId: string) {
    try {
      const { data, error } = await supabase
        .from('platform_clicks')
        .select(`
          platform_link_id,
          platform_links (
            platform_id,
            platform_name
          ),
          created_at,
          country_code
        `)
        .eq('smart_link_id', smartLinkId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting platform clicks:', error);
      return [];
    }
  }

  /**
   * Get aggregated metrics by country for a smart link
   */
  async getClicksByCountry(smartLinkId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_clicks_by_country', { p_smart_link_id: smartLinkId });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting clicks by country:', error);
      return [];
    }
  }
}

export const metricsService = new MetricsService();
