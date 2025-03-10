
/**
 * Types for analytics data and events
 */

export interface PageViewData {
  url: string;
  user_agent?: string;
  country?: string;
  country_code?: string;
  ip_hash?: string;
  session_id?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  screen_width?: number;
  screen_height?: number;
}

export interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
}

export interface PlatformClickData {
  platform_link_id: string;
  smart_link_id?: string;
  user_agent?: string;
  country_code?: string;
  ip_hash?: string;
  session_id?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  screen_width?: number;
  screen_height?: number;
}

/**
 * Dashboard analytics stats structure
 */
export interface DashboardStats {
  totalSmartLinks: number;
  totalViews: number;
  totalClicks: number;
  averageCTR: number;
  topPlatforms: PlatformStat[];
  recentActivity: ActivityItem[];
}

/**
 * Statistics for a single platform
 */
export interface PlatformStat {
  platform_name: string;
  clicks: number;
  percentage: number;
}

/**
 * Recent activity item
 */
export interface ActivityItem {
  type: 'view' | 'click';
  timestamp: string;
  platform?: string;
  smart_link_id: string;
  title?: string;
  artist?: string;
}

/**
 * Geographic statistics
 */
export interface GeoStats {
  countryCode: string;
  views: number;
  clicks: number;
  ctr: number;
}

/**
 * Time-based analytics period
 */
export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

/**
 * Analytics dashboard stats from Supabase
 */
export interface AnalyticsDashboardStatsResult {
  period: string;
  product_visits: number;
  smart_link_visits: number;
  signups: number;
  active_users: number;
  pro_subscribers: number;
  revenue: number;
  social_cards_usage: number;
  meta_pixel_usage: number;
  email_capture_usage: number;
  total_smart_links?: number;
  total_views?: number;
  total_clicks?: number;
  average_ctr?: number;
  top_platforms?: PlatformStat[];
  recent_activity?: ActivityItem[];
}
