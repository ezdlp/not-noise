
export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

export interface PageViewData {
  url: string;
  user_agent: string;
  session_id: string;
  country?: string;
  country_code?: string;
  ip_hash?: string;
}
