
import { TimeRangeValue } from "@/components/analytics/TimeRangeSelect";

export interface DailyStats {
  viewsTrend: number;
  clicksTrend: number;
  ctrTrend: number;
}

export interface GeoStat {
  countryCode: string;
  views: number;
  clicks: number;
  ctr: number;
}

export interface PlatformClickData {
  platform_name: string;
  platform_id: string;
  clicked_at: string;
  country?: string;
  country_code?: string;
  user_agent?: string;
}

export interface PlatformData {
  name: string;
  clicks: number;
}

export interface SmartLinkAnalyticsViewProps {
  smartLink: any;
  weeklyStats: DailyStats | undefined;
  timeRange: TimeRangeValue;
  startDate: string;
  geoStats: GeoStat[] | undefined;
  spotifyPopularity: any;
  isLoadingPopularity: boolean;
  hasSpotifyAccess: boolean;
  onTimeRangeChange: (value: TimeRangeValue) => void;
}
