
import { supabase } from "@/integrations/supabase/client";

interface LocationInfo {
  country: string;
  country_code: string;
  ip_hash: string;
}

class LocationService {
  private locationInfo: LocationInfo | null = null;

  async getLocationInfo(): Promise<LocationInfo | null> {
    // If we already have location info, return it
    if (this.locationInfo) {
      return this.locationInfo;
    }

    try {
      console.log('[LocationService] Fetching location info');
      const { data, error } = await supabase.functions.invoke('get-location');
      
      if (error) {
        console.error('[LocationService] Error invoking get-location function:', error);
        return null;
      }

      if (!data.country || !data.country_code) {
        console.error('[LocationService] Invalid location data received:', data);
        return null;
      }

      const ipHash = await this.hashIP(data.ip);
      
      this.locationInfo = {
        country: data.country,
        country_code: data.country_code,
        ip_hash: ipHash
      };

      console.log('[LocationService] Location info retrieved:', this.locationInfo);
      return this.locationInfo;
    } catch (error) {
      console.error('[LocationService] Error getting location info:', error);
      return null;
    }
  }

  async hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const locationService = new LocationService();
