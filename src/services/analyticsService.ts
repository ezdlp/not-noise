
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

class AnalyticsService {
  private sessionId: string;
  private locationCache: {
    timestamp: number;
    data: { country: string; country_code: string; ip_hash: string };
  } | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async trackPageView(url: string) {
    try {
      const { country, country_code, ip_hash } = await this.getLocationInfo();
      
      await supabase.from('analytics_page_views').insert({
        url,
        user_agent: navigator.userAgent,
        country,
        country_code,
        ip_hash,
        session_id: this.sessionId
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  async trackPlatformClick(platformLinkId: string) {
    try {
      const { country, country_code, ip_hash } = await this.getLocationInfo();
      
      await supabase.from('platform_clicks').insert({
        platform_link_id: platformLinkId,
        user_agent: navigator.userAgent,
        country,
        country_code,
        ip_hash
      });
    } catch (error) {
      console.error('Error tracking platform click:', error);
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
    }
  }

  private async getLocationInfo() {
    try {
      // Check cache first
      if (this.locationCache && 
          Date.now() - this.locationCache.timestamp < this.CACHE_TTL) {
        return this.locationCache.data;
      }

      const { data, error } = await supabase.functions.invoke('get-location')
      
      if (error) throw error;
      
      const ipHash = await this.hashIP(data.ip);
      
      // Cache the result
      this.locationCache = {
        timestamp: Date.now(),
        data: {
          country: data.country,
          country_code: data.country_code,
          ip_hash: ipHash
        }
      };
      
      return this.locationCache.data;
    } catch (error) {
      console.error('Error getting location info:', error);
      return {
        country: null,
        country_code: null,
        ip_hash: null
      };
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
