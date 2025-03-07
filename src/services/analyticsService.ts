
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
  private lastTrackedPath: string | null = null;
  private lastTrackedTime: number = 0;
  private pageViewCount: number = 0;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    console.log('Analytics session initialized with ID:', this.sessionId);
  }

  private getOrCreateSessionId(): string {
    // Try to get existing session ID from storage
    const existingSession = sessionStorage.getItem('analytics_session_id');
    if (existingSession) {
      console.log('[Analytics] Using existing session ID:', existingSession);
      return existingSession;
    }

    // Create new session ID if none exists
    const newSession = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', newSession);
    console.log('[Analytics] Created new session ID:', newSession);
    return newSession;
  }

  async trackPageView(url: string) {
    // Skip tracking for non-URL values or empty paths
    if (!url || typeof url !== 'string') {
      console.log('[Analytics] Invalid URL provided for tracking:', url);
      return;
    }
    
    // Skip tracking for smart links at this level (they're tracked separately)
    if (url.startsWith('/link/')) {
      console.log('[Analytics] Skipping page view tracking for smart link:', url);
      return;
    }

    // Implement de-duplication logic with a more robust approach
    const now = Date.now();
    const isDuplicate = url === this.lastTrackedPath && (now - this.lastTrackedTime < 2000);
    
    if (isDuplicate) {
      console.log('[Analytics] Skipping duplicate page view within 2 seconds:', url);
      return;
    }

    // Initialize tracking if first view
    if (!this.isInitialized) {
      this.isInitialized = true;
      console.log('[Analytics] Initializing tracking for session:', this.sessionId);
      
      // Get location info in the background without blocking
      this.getLocationInfo().catch(error => 
        console.error('[Analytics] Failed to get location info:', error)
      );
    }

    this.pageViewCount++;
    this.lastTrackedPath = url;
    this.lastTrackedTime = now;

    console.log('[Analytics] Tracking page view #' + this.pageViewCount + ' for:', url, 'Session:', this.sessionId);
    
    try {      
      // Track basic page view immediately without waiting for location
      const baseData = {
        url,
        user_agent: navigator.userAgent,
        session_id: this.sessionId
      };

      // Get location info in the background
      const locationInfo = await this.getLocationInfo();
      
      // Track in Supabase with location info if available
      console.log('[Analytics] Inserting page view into analytics_page_views table');
      const { data, error } = await supabase.from('analytics_page_views').insert({
        ...baseData,
        ...(locationInfo && {
          country: locationInfo.country,
          country_code: locationInfo.country_code,
          ip_hash: locationInfo.ip_hash
        })
      });

      if (error) {
        console.error('[Analytics] Error inserting page view:', error);
      } else {
        console.log('[Analytics] Page view tracked successfully in Supabase');
      }
    } catch (error) {
      console.error('[Analytics] Error tracking page view:', error);
      // Don't throw error to prevent breaking the app
      // but log it for debugging
    }
  }

  async getLocationInfo(): Promise<LocationInfo | null> {
    // If we already have location info, return it
    if (this.locationInfo) {
      return this.locationInfo;
    }

    try {
      console.log('[Analytics] Fetching location info');
      const { data, error } = await supabase.functions.invoke('get-location');
      
      if (error) {
        console.error('[Analytics] Error invoking get-location function:', error);
        return null;
      }

      if (!data.country || !data.country_code) {
        console.error('[Analytics] Invalid location data received:', data);
        return null;
      }

      const ipHash = await this.hashIP(data.ip);
      
      this.locationInfo = {
        country: data.country,
        country_code: data.country_code,
        ip_hash: ipHash
      };

      console.log('[Analytics] Location info retrieved:', this.locationInfo);
      return this.locationInfo;
    } catch (error) {
      console.error('[Analytics] Error getting location info:', error);
      return null;
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
    console.log('[Analytics] Tracking login event with metadata:', metadata);
    await this.trackEvent({
      event_type: 'login',
      event_data: metadata
    });
  }

  async trackSpotifyPopularityView(smartLinkId: string) {
    console.log('[Analytics] Tracking Spotify popularity view for link:', smartLinkId);
    await this.trackEvent({
      event_type: 'spotify_popularity_view',
      event_data: {
        smart_link_id: smartLinkId
      }
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
