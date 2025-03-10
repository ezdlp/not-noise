
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, GeoStats, PlatformStat, ActivityItem, AnalyticsDashboardStatsResult } from '@/models/analytics';

/**
 * Class for fetching and processing analytics metrics
 */
class MetricsService {
  /**
   * Get statistics for a specific smart link
   */
  async getSmartLinkStats(linkId: string, period: string = '30d'): Promise<any> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      // Fetch views from the database
      const { data: viewsData, error: viewsError } = await supabase
        .from('link_views')
        .select('*')
        .eq('smart_link_id', linkId)
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());
      
      if (viewsError) throw viewsError;
      
      const totalViews = viewsData?.length || 0;
      
      // Get click data
      const { data: clickData, error: clickError } = await supabase
        .from('platform_clicks')
        .select('*, platform_links!inner(*)')
        .eq('platform_links.smart_link_id', linkId)
        .gte('clicked_at', startDate.toISOString())
        .lte('clicked_at', endDate.toISOString());
      
      if (clickError) throw clickError;
      
      const totalClicks = clickData?.length || 0;
      const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      
      // Get platform breakdown
      const platformStats: Record<string, number> = {};
      clickData?.forEach((click) => {
        const platform = click.platform_links.platform_name;
        platformStats[platform] = (platformStats[platform] || 0) + 1;
      });
      
      // Convert to array of platform stats
      const platforms: PlatformStat[] = Object.entries(platformStats).map(([platform_name, clicks]) => ({
        platform_name,
        clicks,
        percentage: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0
      }));
      
      return {
        total_views: totalViews,
        total_clicks: totalClicks,
        unique_visitors: 0, // Would need to count unique visitors from view data
        click_rate: clickRate,
        platforms: platforms
      };
    } catch (error) {
      console.error('Error getting smart link stats:', error);
      throw error;
    }
  }
  
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch statistics from the analytics_dashboard_stats function
      const { data, error } = await supabase
        .rpc('get_analytics_dashboard_stats');
      
      if (error) throw error;
      
      // Assuming we get data in the current period
      const currentPeriod = data?.filter(item => item.period === 'current')[0] as AnalyticsDashboardStatsResult;
      
      if (!currentPeriod) {
        throw new Error('No current period data available');
      }
      
      // Create mock data for now - in a real implementation, this would come from the database
      // We're mapping from the actual data we have to the expected DashboardStats format
      return {
        totalSmartLinks: 0, // Would need another query to get this
        totalViews: currentPeriod.smart_link_visits,
        totalClicks: 0, // Would need another query for this
        averageCTR: 0, // Calculate based on views and clicks
        topPlatforms: [], // Would need another query for platform breakdown
        recentActivity: [] // Would need another query for recent activity
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Return default empty data
      return {
        totalSmartLinks: 0,
        totalViews: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPlatforms: [],
        recentActivity: []
      };
    }
  }
  
  /**
   * Get geographic statistics for link views and clicks
   */
  async getGeoStats(linkId: string): Promise<GeoStats[]> {
    try {
      // Get views by country - fixed query to use simple select and filter
      const { data: viewsData, error: viewsError } = await supabase
        .from('link_views')
        .select('country_code')
        .eq('smart_link_id', linkId)
        .not('country_code', 'is', null);
      
      if (viewsError) throw viewsError;
      
      // Transform view data manually since we can't use group
      const viewsByCountry: Record<string, number> = {};
      viewsData?.forEach((item) => {
        if (item.country_code) {
          viewsByCountry[item.country_code] = (viewsByCountry[item.country_code] || 0) + 1;
        }
      });
      
      // Get clicks by country - fixed query to use simple select and filter
      const { data: clicksData, error: clicksError } = await supabase
        .from('platform_clicks')
        .select('country_code')
        .eq('platform_link_id', linkId)
        .not('country_code', 'is', null);
      
      if (clicksError) throw clicksError;
      
      // Transform click data manually
      const clicksByCountry: Record<string, number> = {};
      clicksData?.forEach((item) => {
        if (item.country_code) {
          clicksByCountry[item.country_code] = (clicksByCountry[item.country_code] || 0) + 1;
        }
      });
      
      // Combine the data
      const countryCodes = new Set([
        ...Object.keys(viewsByCountry),
        ...Object.keys(clicksByCountry)
      ]);
      
      const geoStats: GeoStats[] = Array.from(countryCodes).map(countryCode => {
        const views = viewsByCountry[countryCode] || 0;
        const clicks = clicksByCountry[countryCode] || 0;
        const ctr = views > 0 ? (clicks / views) * 100 : 0;
        
        return {
          countryCode,
          views,
          clicks,
          ctr
        };
      });
      
      return geoStats.sort((a, b) => b.views - a.views);
    } catch (error) {
      console.error('Error getting geo stats:', error);
      return [];
    }
  }
}

export const metricsService = new MetricsService();
