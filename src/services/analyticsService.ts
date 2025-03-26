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
  private pendingPageViews: Set<string> = new Set();
  private isProcessingPageView: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    // Reduce logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Analytics session initialized with ID:', this.sessionId);
    }
  }

  private getOrCreateSessionId(): string {
    // Try to get existing session ID from storage
    const existingSession = sessionStorage.getItem('analytics_session_id');
    if (existingSession) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Using existing session ID:', existingSession);
      }
      return existingSession;
    }

    // Create new session ID if none exists
    const newSession = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', newSession);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Created new session ID:', newSession);
    }
    return newSession;
  }

  async trackPageView(url: string) {
    // Skip tracking for non-URL values or empty paths
    if (!url || typeof url !== 'string') {
      return;
    }
    
    // Skip tracking for smart links at this level (they're tracked separately)
    if (url.startsWith('/link/')) {
      return;
    }

    // Add exponential back-off for repeated tracking attempts
    // to prevent browser throttling
    const now = Date.now();
    const timeSinceLastTracking = now - this.lastTrackedTime;
    
    // If the same URL is tracked within a short time frame, skip it
    const isDuplicate = url === this.lastTrackedPath && timeSinceLastTracking < 2000;
    if (isDuplicate) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Skipping duplicate page view within 2 seconds:', url);
      }
      return;
    }
    
    // Add to pending queue
    this.pendingPageViews.add(url);
    
    // Update tracking state
    this.lastTrackedPath = url;
    this.lastTrackedTime = now;
    
    // If already processing a view, the next one will be picked up from the queue
    if (this.isProcessingPageView) {
      return;
    }
    
    // Process queue
    this.processNextPageView();
  }
  
  private async processNextPageView() {
    if (this.pendingPageViews.size === 0 || this.isProcessingPageView) {
      return;
    }
    
    this.isProcessingPageView = true;
    
    // Get the next URL from the queue
    const url = Array.from(this.pendingPageViews)[0];
    this.pendingPageViews.delete(url);
    
    try {
      // Initialize tracking if first view
      if (!this.isInitialized) {
        this.isInitialized = true;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Analytics] Initializing tracking for session:', this.sessionId);
        }
        
        // Get location info in the background without blocking
        this.getLocationInfo().catch(() => {
          // Silent fail - location info is optional
        });
      }

      this.pageViewCount++;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Tracking page view #' + this.pageViewCount + ' for:', url, 'Session:', this.sessionId);
      }
      
      // Track basic page view immediately without waiting for location
      const baseData = {
        url,
        user_agent: navigator.userAgent,
        session_id: this.sessionId
      };

      // Get location info in the background
      const locationInfo = await this.getLocationInfo();
      
      // Track in Supabase with location info if available
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Inserting page view into analytics_page_views table');
      }
      
      const { error } = await supabase.from('analytics_page_views').insert({
        ...baseData,
        ...(locationInfo && {
          country: locationInfo.country,
          country_code: locationInfo.country_code,
          ip_hash: locationInfo.ip_hash
        })
      });

      if (error) {
        console.error('[Analytics] Error inserting page view:', error);
      } else if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Page view tracked successfully in Supabase');
      }
    } catch (error) {
      console.error('[Analytics] Error tracking page view:', error);
    } finally {
      this.isProcessingPageView = false;
      
      // Check if there are more items in the queue
      if (this.pendingPageViews.size > 0) {
        // Add a small delay to prevent rapid API calls
        setTimeout(() => this.processNextPageView(), 100);
      }
    }
  }

  async getLocationInfo(): Promise<LocationInfo | null> {
    // If we already have location info, return it
    if (this.locationInfo) {
      return this.locationInfo;
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Fetching location info');
      }
      
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

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics] Location info retrieved:', this.locationInfo);
      }
      
      return this.locationInfo;
    } catch (error) {
      console.error('[Analytics] Error getting location info:', error);
      return null;
    }
  }

  async trackEvent(event: AnalyticsEvent) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Tracking event:', event.event_type, event.event_data);
      }
      
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
    // Use subtle crypto API to hash the IP address
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + navigator.userAgent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert the hash to a hex string
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const analyticsService = new AnalyticsService();
