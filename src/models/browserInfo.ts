
/**
 * Interface for browser information
 */
export interface BrowserInfo {
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
}

/**
 * Interface for detailed session information including geolocation
 */
export interface SessionInfo extends BrowserInfo {
  session_id: string;
  country?: string;
  country_code?: string;
  ip_hash?: string;
}
