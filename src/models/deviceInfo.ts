
export interface DeviceInfo {
  user_agent: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  screen_width?: number;
  screen_height?: number;
}
