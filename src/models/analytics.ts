
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
