
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsPeriod } from '@/models/analytics';
import { 
  GeoStats, 
  DashboardStats,
  PlatformStat,
  ActivityItem,
  SmartLinkStatsResponse,
  DashboardStatsResponse
} from '../types/analyticsTypes';

/**
 * Service for retrieving analytics metrics
 */
class MetricsService {
  
  /**
   * Get smart link stats for a specific link
   */
  async getSmartLinkStats(smartLinkId: string, period: AnalyticsPeriod): Promise<{
    views: number;
    clicks: number;
    visitors: number;
    clickRate: number;
    platforms: PlatformStat[];
  }> {
    try {
      // Call the appropriate Supabase stored procedure or direct query
      const { data, error } = await supabase.rpc('get_basic_analytics_stats', {
        p_start_date: this.getPeriodStartDate(period),
        p_end_date: new Date().toISOString()
      });

      if (error) throw error;
      
      // Transform and aggregate the data
      const statsData = data as SmartLinkStatsResponse[];
      
      // Default return structure
      const result = {
        views: 0,
        clicks: 0,
        visitors: 0,
        clickRate: 0,
        platforms: [] as PlatformStat[]
      };
      
      if (statsData && statsData.length > 0) {
        // Calculate aggregate metrics from the data
        // For now we're using placeholder calculations
        result.views = statsData.reduce((sum, item) => sum + item.smart_link_views, 0);
        result.clicks = 0; // This would need actual platform clicks data
        result.visitors = statsData.reduce((sum, item) => sum + item.unique_visitors, 0);
        result.clickRate = result.views > 0 ? (result.clicks / result.views) * 100 : 0;
      }
      
      return result;
    } catch (error) {
      console.error('Error getting smart link stats:', error);
      throw error;
    }
  }

  /**
   * Get dashboard analytics stats
   */
  async getDashboardStats(period: AnalyticsPeriod): Promise<DashboardStats> {
    try {
      const { data, error } = await supabase.rpc('get_analytics_dashboard_stats', {
        p_start_date: this.getPeriodStartDate(period),
        p_end_date: new Date().toISOString()
      });

      if (error) throw error;
      
      const statsData = data as DashboardStatsResponse[];
      
      // Default return value
      const result: DashboardStats = {
        totalSmartLinks: 0,
        totalViews: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPlatforms: [],
        recentActivity: []
      };
      
      if (statsData && statsData.length > 0) {
        const currentPeriod = statsData.find(item => item.period === 'current');
        
        if (currentPeriod) {
          // Use the values from the database that actually exist
          result.totalViews = currentPeriod.smart_link_visits;
          result.totalClicks = 0; // Need actual platform clicks data
          result.averageCTR = result.totalViews > 0 ? (result.totalClicks / result.totalViews) * 100 : 0;
          
          // We need to query these separately as they're not in the dashboard stats
          await this.populatePlatformsAndActivity(result);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
  
  /**
   * Get geographic stats for analytics
   */
  async getGeoStats(period: AnalyticsPeriod): Promise<GeoStats[]> {
    try {
      // Query link views by country for the period
      const { data: viewsData, error: viewsError } = await supabase
        .from('link_views')
        .select('country_code, count(*)')
        .gte('viewed_at', this.getPeriodStartDate(period))
        .not('country_code', 'is', null)
        .select('country_code, count(*)')
        .group('country_code');
        
      if (viewsError) throw viewsError;
      
      // Query platform clicks by country for the period
      const { data: clicksData, error: clicksError } = await supabase
        .from('platform_clicks')
        .select('country_code, count(*)')
        .gte('clicked_at', this.getPeriodStartDate(period))
        .not('country_code', 'is', null)
        .select('country_code, count(*)')
        .group('country_code');
        
      if (clicksError) throw clicksError;
      
      // Combine the data
      const geoStatsMap = new Map<string, GeoStats>();
      
      // Process views data
      (viewsData || []).forEach((item: any) => {
        if (item && item.country_code) {
          geoStatsMap.set(item.country_code, {
            countryCode: item.country_code,
            views: parseInt(item.count, 10) || 0,
            clicks: 0
          });
        }
      });
      
      // Process clicks data
      (clicksData || []).forEach((item: any) => {
        if (item && item.country_code) {
          const existing = geoStatsMap.get(item.country_code);
          
          if (existing) {
            existing.clicks = parseInt(item.count, 10) || 0;
          } else {
            geoStatsMap.set(item.country_code, {
              countryCode: item.country_code,
              views: 0,
              clicks: parseInt(item.count, 10) || 0
            });
          }
        }
      });
      
      return Array.from(geoStatsMap.values());
    } catch (error) {
      console.error('Error getting geo stats:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to populate platforms and activity data
   */
  private async populatePlatformsAndActivity(result: DashboardStats): Promise<void> {
    try {
      // Get top platforms by clicks
      const { data: platformsData, error: platformsError } = await supabase
        .from('platform_links')
        .select(`
          platform_name,
          platform_clicks:platform_clicks(count)
        `)
        .order('platform_clicks', { ascending: false })
        .limit(5);
        
      if (platformsError) throw platformsError;
      
      // Process platform data
      result.topPlatforms = (platformsData || []).map((item: any) => ({
        platform_name: item.platform_name,
        clicks: item.platform_clicks?.length || 0,
        percentage: 0 // Calculate this if needed
      }));
      
      // Calculate percentages
      const totalClicks = result.topPlatforms.reduce((sum, item) => sum + item.clicks, 0);
      result.topPlatforms.forEach(platform => {
        platform.percentage = totalClicks > 0 ? (platform.clicks / totalClicks) * 100 : 0;
      });
      
      // Get recent activity (views and clicks)
      const { data: activityData, error: activityError } = await supabase
        .from('link_views')
        .select(`
          id,
          viewed_at,
          smart_link_id,
          smart_links(title, artist_name)
        `)
        .order('viewed_at', { ascending: false })
        .limit(5);
        
      if (activityError) throw activityError;
      
      // Process activity data
      result.recentActivity = (activityData || []).map((item: any) => ({
        type: 'view',
        timestamp: item.viewed_at,
        smart_link_id: item.smart_link_id,
        title: item.smart_links?.title || '',
        artist: item.smart_links?.artist_name || ''
      }));
    } catch (error) {
      console.error('Error populating platforms and activity:', error);
    }
  }
  
  /**
   * Helper to get the start date based on the period
   */
  private getPeriodStartDate(period: AnalyticsPeriod): string {
    const now = new Date();
    
    switch(period) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      case 'all':
        // Use a far past date for "all time"
        now.setFullYear(2020, 0, 1);
        break;
    }
    
    return now.toISOString();
  }
}

export const metricsService = new MetricsService();
