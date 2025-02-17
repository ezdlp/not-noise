
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

interface LocationInfo {
  country: string;
  country_code: string;
  ip_hash: string;
}

class AnalyticsService {
  private sessionId: string;
  private locationInfo: LocationInfo | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async getLocationInfo(): Promise<LocationInfo | null> {
    if (this.locationInfo) {
      return this.locationInfo;
    }

    try {
      console.log('Fetching location info...');
      const { data, error } = await supabase.functions.invoke('get-location');
      
      if (error) {
        console.error('Error invoking get-location function:', error);
        throw error;
      }

      if (!data.country || !data.country_code) {
        console.error('Invalid location data received:', data);
        return null;
      }

      const ipHash = await this.hashIP(data.ip);
      
      this.locationInfo = {
        country: data.country,
        country_code: data.country_code,
        ip_hash: ipHash
      };

      console.log('Location info retrieved successfully:', {
        country: this.locationInfo.country,
        country_code: this.locationInfo.country_code
      });

      return this.locationInfo;
    } catch (error) {
      console.error('Error getting location info:', error);
      return null;
    }
  }

  async trackPageView(url: string) {
    try {
      console.log('Tracking page view for:', url);
      const locationInfo = await this.getLocationInfo();
      
      if (!locationInfo) {
        console.warn('Location info not available for page view');
        return;
      }
      
      await supabase.from('analytics_page_views').insert({
        url,
        user_agent: navigator.userAgent,
        country: locationInfo.country,
        country_code: locationInfo.country_code,
        ip_hash: locationInfo.ip_hash,
        session_id: this.sessionId
      });

      console.log('Page view tracked successfully with location:', locationInfo);
    } catch (error) {
      console.error('Error tracking page view:', error);
      throw error;
    }
  }

  async trackPlatformClick(platformLinkId: string) {
    try {
      console.log('Tracking platform click for:', platformLinkId);
      const locationInfo = await this.getLocationInfo();
      
      if (!locationInfo) {
        console.warn('Location info not available for platform click');
        return;
      }
      
      await supabase.from('platform_clicks').insert({
        platform_link_id: platformLinkId,
        user_agent: navigator.userAgent,
        country: locationInfo.country,
        country_code: locationInfo.country_code,
        ip_hash: locationInfo.ip_hash
      });
      
      console.log('Platform click tracked successfully with location:', locationInfo);
    } catch (error) {
      console.error('Error tracking platform click:', error);
      throw error;
    }
  }

  async trackEvent(event: AnalyticsEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('analytics_events').insert({
        ...event,
        user_id: user?.id,
        session_id: this.sessionId
      });
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  private async hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const analyticsService = new AnalyticsService();

