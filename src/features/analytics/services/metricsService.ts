
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for fetching analytics metrics from the database
 */
export interface DashboardStats {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
  total_revenue: number;
  smart_links_created: number;
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
}

export interface GeoStats {
  countryCode: string;
  views: number;
  clicks: number;
  ctr: number;
}

// Fix for the excessive type depth error - use a simpler type definition
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'custom';

export interface CountryClicksResponse {
  country_code: string;
  count: number;
}

export const metricsService = {
  /**
   * Get dashboard analytics stats
   */
  async getDashboardStats(timeRange: AnalyticsTimeRange = '30d'): Promise<DashboardStats[]> {
    try {
      let startDate = new Date();
      
      // Calculate start date based on time range
      if (timeRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeRange === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }
      
      const { data, error } = await supabase
        .rpc('get_improved_analytics_stats', {
          p_start_date: startDate.toISOString(),
        });
      
      if (error) throw error;
      
      return data as DashboardStats[];
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return [];
    }
  },
  
  /**
   * Get clicks by country
   */
  async getClicksByCountry(): Promise<GeoStats[]> {
    try {
      // Fix: Update the RPC function name to match what's available in Supabase
      const { data, error } = await supabase
        .rpc('get_clicks_by_country_code');
      
      if (error) throw error;
      
      // Transform the data to match the GeoStats interface
      return (data as CountryClicksResponse[]).map(item => ({
        countryCode: item.country_code,
        views: 0, // We'll need to update this if views data becomes available
        clicks: item.count,
        ctr: 0 // Calculate CTR if views data becomes available
      }));
    } catch (error) {
      console.error("Error fetching clicks by country:", error);
      return [];
    }
  },
  
  /**
   * Get geographic breakdown of views and clicks
   */
  async getGeoStats(): Promise<GeoStats[]> {
    try {
      // For now, we'll just return the clicks data
      // In the future, we can combine with views data when available
      return this.getClicksByCountry();
    } catch (error) {
      console.error("Error fetching geo stats:", error);
      return [];
    }
  }
};
