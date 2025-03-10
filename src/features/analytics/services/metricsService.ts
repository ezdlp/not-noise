
import { supabase } from '@/integrations/supabase/client';
import { GeoStats, DashboardStats, PlatformStat, ActivityItem } from '@/models/analytics';

/**
 * Service for fetching analytics metrics from the database
 */
class MetricsService {
  /**
   * Get analytics data for a smart link
   */
  async getSmartLinkAnalytics(linkId: string, period: '7d' | '30d' | '90d' | 'all' = '30d') {
    const startDate = this.getStartDateFromPeriod(period);
    
    try {
      const { data, error } = await supabase.rpc('get_smart_link_stats', {
        p_start_date: startDate.toISOString(),
        p_smart_link_id: linkId
      });
      
      if (error) throw error;
      
      return {
        totalViews: data?.[0]?.total_views || 0,
        totalClicks: data?.[0]?.total_clicks || 0,
        uniqueVisitors: data?.[0]?.unique_visitors || 0,
        clickRate: data?.[0]?.click_rate || 0,
        platforms: data?.[0]?.platforms || []
      };
    } catch (error) {
      console.error('[MetricsService] Error getting smart link analytics:', error);
      return {
        totalViews: 0,
        totalClicks: 0,
        uniqueVisitors: 0,
        clickRate: 0,
        platforms: []
      };
    }
  }
  
  /**
   * Get dashboard analytics statistics
   */
  async getDashboardStats(period: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<DashboardStats> {
    const startDate = this.getStartDateFromPeriod(period);
    
    try {
      const { data, error } = await supabase.rpc('get_analytics_dashboard_stats', {
        p_start_date: startDate.toISOString()
      });
      
      if (error) throw error;
      
      // Default values if data is missing
      const defaultStats: DashboardStats = {
        totalSmartLinks: 0,
        totalViews: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPlatforms: [],
        recentActivity: []
      };
      
      // Return data or default values
      return {
        totalSmartLinks: data?.[0]?.total_smart_links || defaultStats.totalSmartLinks,
        totalViews: data?.[0]?.total_views || defaultStats.totalViews,
        totalClicks: data?.[0]?.total_clicks || defaultStats.totalClicks,
        averageCTR: data?.[0]?.average_ctr || defaultStats.averageCTR,
        topPlatforms: data?.[0]?.top_platforms || defaultStats.topPlatforms,
        recentActivity: data?.[0]?.recent_activity || defaultStats.recentActivity
      };
    } catch (error) {
      console.error('[MetricsService] Error getting dashboard stats:', error);
      
      // Return default values in case of error
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
   * Get geographic statistics for a smart link
   */
  async getGeoStats(linkId?: string, period: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<GeoStats[]> {
    const startDate = this.getStartDateFromPeriod(period);
    
    try {
      let query;
      
      if (linkId) {
        // For a specific smart link, get geographic data for that link
        query = supabase
          .from('link_views')
          .select(`
            country_code,
            count(*) as views,
            platform_clicks:platform_clicks!inner(country_code, count)
          `)
          .eq('smart_link_id', linkId)
          .gte('viewed_at', startDate.toISOString());
      } else {
        // For all links, aggregate the data across all links
        query = supabase
          .from('link_views')
          .select(`
            country_code, 
            count(*) as views
          `)
          .gte('viewed_at', startDate.toISOString());
      }
      
      const { data: viewsData, error: viewsError } = await query;
      
      if (viewsError) throw viewsError;
      
      // For getting click data, we need to do a separate query since we need to join tables
      let clicksData: any[] = [];
      
      if (linkId) {
        const { data, error } = await supabase
          .from('platform_clicks')
          .select(`
            country_code, 
            count(*) as clicks,
            platform_links!inner(smart_link_id)
          `)
          .eq('platform_links.smart_link_id', linkId)
          .gte('clicked_at', startDate.toISOString());
          
        if (error) throw error;
        clicksData = data;
      } else {
        const { data, error } = await supabase
          .from('platform_clicks')
          .select(`
            country_code, 
            count(*) as clicks
          `)
          .gte('clicked_at', startDate.toISOString());
          
        if (error) throw error;
        clicksData = data;
      }
      
      // Combine the views and clicks data
      const geoStats: GeoStats[] = viewsData.map((viewData) => {
        const countryCode = viewData.country_code;
        const views = parseInt(viewData.views, 10);
        
        // Find matching click data for this country
        const clickData = clicksData.find(c => c.country_code === countryCode);
        const clicks = clickData ? parseInt(clickData.clicks, 10) : 0;
        
        // Calculate CTR (Click-Through Rate)
        const ctr = views > 0 ? clicks / views : 0;
        
        return {
          countryCode,
          views,
          clicks,
          ctr
        };
      });
      
      // Add any countries that have clicks but no views
      clicksData.forEach((clickData) => {
        const countryCode = clickData.country_code;
        
        // Check if this country is already in the geoStats array
        if (!geoStats.some(gs => gs.countryCode === countryCode)) {
          geoStats.push({
            countryCode,
            views: 0,
            clicks: parseInt(clickData.clicks, 10),
            ctr: 1 // 100% CTR since all views resulted in clicks
          });
        }
      });
      
      return geoStats;
    } catch (error) {
      console.error('[MetricsService] Error getting geo stats:', error);
      return [];
    }
  }
  
  /**
   * Calculate the start date based on period
   */
  private getStartDateFromPeriod(period: '7d' | '30d' | '90d' | 'all'): Date {
    const now = new Date();
    
    switch (period) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      case 'all':
        return new Date(2020, 0, 1); // Start from January 1, 2020 as a reasonable "all time" date
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }
}

export const metricsService = new MetricsService();
