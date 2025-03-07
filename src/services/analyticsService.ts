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
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeTracking();
  }

  private getOrCreateSessionId(): string {
    // Try to get existing session ID from storage
    const existingSession = sessionStorage.getItem('analytics_session_id');
    if (existingSession) {
      return existingSession;
    }

    // Create new session ID if none exists
    const newSession = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', newSession);
    return newSession;
  }

  private initializeTracking() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Track initial page view
    this.trackPageView(window.location.pathname);

    // Setup navigation tracking
    if (typeof window !== 'undefined') {
      this.setupHistoryTracking();
    }

    // Get location info in the background
    this.getLocationInfo().catch(console.error);
  }

  private setupHistoryTracking() {
    // Track navigation changes
    ['pushState', 'replaceState'].forEach(method => {
      const original = window.history[method];
      window.history[method] = function(...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
    });

    // Listen for navigation events
    window.addEventListener('locationchange', () => {
      this.trackPageView(window.location.pathname);
    });

    // Listen for popstate
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
  }

  async getLocationInfo(): Promise<LocationInfo | null> {
    // If we already have location info, return it
    if (this.locationInfo) {
      return this.locationInfo;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-location');
      
      if (error) {
        console.error('Error invoking get-location function:', error);
        return null;
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

      return this.locationInfo;
    } catch (error) {
      console.error('Error getting location info:', error);
      return null;
    }
  }

  async trackPageView(url: string) {
    // Skip tracking for smart links
    if (url.startsWith('/link/')) {
      return;
    }

    try {
      console.log('Tracking page view for:', url);
      
      // Track basic page view immediately without waiting for location
      const baseData = {
        url,
        user_agent: navigator.userAgent,
        session_id: this.sessionId
      };

      // Track in GA4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_location: url,
          page_title: document.title,
          session_id: this.sessionId
        });
      }

      // Get location info in the background
      const locationInfo = await this.getLocationInfo();
      
      // Track in Supabase with location info if available
      await supabase.from('analytics_page_views').insert({
        ...baseData,
        ...(locationInfo && {
          country: locationInfo.country,
          country_code: locationInfo.country_code,
          ip_hash: locationInfo.ip_hash
        })
      });

      console.log('Page view tracked successfully');
    } catch (error) {
      console.error('Error tracking page view:', error);
      // Don't throw error to prevent breaking the app
      // but log it for debugging
    }
  }

  async trackEvent(event: AnalyticsEvent) {
    try {
      console.log('Tracking event:', event.event_type, event.event_data);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Track in Supabase
      await supabase.from('analytics_events').insert({
        ...event,
        user_id: user?.id,
        session_id: this.sessionId
      });

      // Track in GA4
      if (typeof gtag !== 'undefined') {
        gtag('event', event.event_type, {
          ...event.event_data,
          user_id: user?.id,
          session_id: this.sessionId
        });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  async trackUserAction(action: string, metadata: Record<string, any> = {}) {
    await this.trackEvent({
      event_type: action,
      event_data: metadata
    });
  }

  async trackFeatureUsage(feature: string, metadata: Record<string, any> = {}) {
    await this.trackEvent({
      event_type: 'feature_usage',
      event_data: {
        feature,
        ...metadata
      }
    });
  }

  async trackSubscriptionEvent(event: string, tier: string, metadata: Record<string, any> = {}) {
    await this.trackEvent({
      event_type: 'subscription_event',
      event_data: {
        event,
        tier,
        ...metadata
      }
    });
  }

  async trackPlatformClick(platformLinkId: string) {
    try {
      const locationInfo = await this.getLocationInfo();
      
      // Track in Supabase platform_clicks table
      await supabase.from('platform_clicks').insert({
        platform_link_id: platformLinkId,
        user_agent: navigator.userAgent,
        country_code: locationInfo?.country_code,
        ip_hash: locationInfo?.ip_hash,
        session_id: this.sessionId
      });

      // Track as a general analytics event
      await this.trackEvent({
        event_type: 'platform_click',
        event_data: {
          platform_link_id: platformLinkId
        }
      });
    } catch (error) {
      console.error('Error tracking platform click:', error);
      throw error;
    }
  }

  async trackLogin(metadata: Record<string, any> = {}) {
    console.log('Tracking login event');
    await this.trackEvent({
      event_type: 'login',
      event_data: metadata
    });
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
