
import { supabase } from '@/integrations/supabase/client';
import { GeoStats, DashboardStats, AnalyticsMetrics } from '../types/analyticsTypes';

/**
 * Service for fetching analytics metrics and statistics
 */
export class MetricsService {
  /**
   * Retrieve basic analytics statistics (page views, clicks, etc.)
   */
  async getBasicStats(linkId?: string): Promise<AnalyticsMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_basic_analytics_stats', {
        link_id: linkId,
      });

      if (error) throw error;
      
      return {
        totalViews: data.total_views || 0,
        totalClicks: data.total_clicks || 0,
        uniqueVisitors: data.unique_visitors || 0,
        clickRate: data.click_rate || 0,
        platforms: data.platforms || [],
      };
    } catch (error) {
      console.error('[MetricsService] Error fetching basic stats:', error);
      return {
        totalViews: 0,
        totalClicks: 0,
        uniqueVisitors: 0,
        clickRate: 0,
        platforms: [],
      };
    }
  }

  /**
   * Get dashboard analytics statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data, error } = await supabase.rpc('get_analytics_dashboard_stats');

      if (error) throw error;

      return {
        totalSmartLinks: data.total_smart_links || 0,
        totalViews: data.total_views || 0,
        totalClicks: data.total_clicks || 0,
        averageCTR: data.average_ctr || 0,
        topPlatforms: data.top_platforms || [],
        recentActivity: data.recent_activity || [],
      };
    } catch (error) {
      console.error('[MetricsService] Error fetching dashboard stats:', error);
      return {
        totalSmartLinks: 0,
        totalViews: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPlatforms: [],
        recentActivity: [],
      };
    }
  }

  /**
   * Get click count data grouped by country
   */
  async getClicksByCountry(): Promise<GeoStats[]> {
    try {
      // Query platform_clicks table and count by country_code
      const { data, error } = await supabase
        .from('platform_clicks')
        .select('country_code, count')
        .not('country_code', 'is', null)
        .select('country_code, count(*)');
      
      if (error) throw error;
      
      // Transform the data to match the GeoStats interface
      return (data || []).map(item => ({
        countryCode: item.country_code,
        views: 0, // We'll need to update this if views data becomes available
        clicks: parseInt(String(item.count)), // Convert to string before parsing to avoid type error
      }));
    } catch (error) {
      console.error('[MetricsService] Error fetching clicks by country:', error);
      return [];
    }
  }
}

export const metricsService = new MetricsService();
