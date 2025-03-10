
/**
 * Analytics types used by metrics service
 */

// Geographic statistics type
export interface GeoStats {
  countryCode: string;
  views: number;
  clicks: number;
}

// Dashboard stats interface
export interface DashboardStats {
  totalSmartLinks: number;
  totalViews: number;
  totalClicks: number;
  averageCTR: number;
  topPlatforms: PlatformStat[];
  recentActivity: ActivityItem[];
}

// Platform statistics
export interface PlatformStat {
  platform_name: string;
  clicks: number;
  percentage: number;
}

// Activity item for recent activity
export interface ActivityItem {
  type: 'view' | 'click';
  timestamp: string;
  platform?: string;
  smart_link_id: string;
  title?: string;
  artist?: string;
}

// Smart link stats response
export interface SmartLinkStatsResponse {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
}

// Dashboard stats response
export interface DashboardStatsResponse {
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
}
