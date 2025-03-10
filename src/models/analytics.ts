
export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  screen_dimensions?: string;
}

export interface PageViewData {
  url: string;
  user_agent: string;
  session_id: string;
  country?: string;
  country_code?: string;
  ip_hash?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  screen_width?: number;
  screen_height?: number;
}
