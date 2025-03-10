
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsEvent, PageViewData } from "@/models/analytics";
import { locationService } from "@/services/locationService";
import { sessionService } from "@/services/sessionService";
import { deviceInfoService } from "@/services/deviceInfoService";

class AnalyticsService {
  private isInitialized: boolean = false;
  private lastTrackedPath: string | null = null;
  private lastTrackedTime: number = 0;
  private pageViewCount: number = 0;

  constructor() {
    console.log('Analytics service initialized');
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
      console.log('[Analytics] Initializing tracking for session:', sessionService.getSessionId());
    }

    this.pageViewCount++;
    this.lastTrackedPath = url;
    this.lastTrackedTime = now;

    console.log('[Analytics] Tracking page view #' + this.pageViewCount + ' for:', url, 'Session:', sessionService.getSessionId());
    
    try {
      // Get device information
      const deviceInfo = deviceInfoService.getDeviceInfo();
      
      // Track basic page view immediately without waiting for location
      const baseData: PageViewData = {
        url,
        user_agent: deviceInfo.user_agent,
        session_id: sessionService.getSessionId()
      };

      // Get location info in the background
      const locationInfo = await locationService.getLocationInfo();
      
      // Track in Supabase with location info if available
      console.log('[Analytics] Inserting page view into analytics_page_views table');
      const { data, error } = await supabase.from('analytics_page_views').insert({
        ...baseData,
        ...(locationInfo && {
          country: locationInfo.country,
          country_code: locationInfo.country_code,
          ip_hash: locationInfo.ip_hash
        }),
        browser_name: deviceInfo.browser_name,
        browser_version: deviceInfo.browser_version,
        os_name: deviceInfo.os_name,
        os_version: deviceInfo.os_version,
        device_type: deviceInfo.device_type,
        screen_width: deviceInfo.screen_width,
        screen_height: deviceInfo.screen_height
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

  async trackEvent(event: AnalyticsEvent) {
    try {
      console.log('Tracking event:', event.event_type, event.event_data);
      const { data: { user } } = await supabase.auth.getUser();
      const deviceInfo = deviceInfoService.getDeviceInfo();
      
      // Track in Supabase
      await supabase.from('analytics_events').insert({
        ...event,
        user_id: user?.id,
        session_id: sessionService.getSessionId(),
        browser_name: deviceInfo.browser_name,
        browser_version: deviceInfo.browser_version,
        os_name: deviceInfo.os_name,
        os_version: deviceInfo.os_version,
        device_type: deviceInfo.device_type,
        screen_dimensions: deviceInfo.screen_width && deviceInfo.screen_height 
          ? `${deviceInfo.screen_width}x${deviceInfo.screen_height}` 
          : null
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
      const locationInfo = await locationService.getLocationInfo();
      const deviceInfo = deviceInfoService.getDeviceInfo();
      
      // Track in Supabase platform_clicks table
      await supabase.from('platform_clicks').insert({
        platform_link_id: platformLinkId,
        user_agent: deviceInfo.user_agent,
        country_code: locationInfo?.country_code,
        ip_hash: locationInfo?.ip_hash,
        session_id: sessionService.getSessionId(),
        browser_name: deviceInfo.browser_name,
        browser_version: deviceInfo.browser_version,
        os_name: deviceInfo.os_name,
        os_version: deviceInfo.os_version,
        device_type: deviceInfo.device_type,
        screen_width: deviceInfo.screen_width,
        screen_height: deviceInfo.screen_height
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
}

export const analyticsService = new AnalyticsService();
