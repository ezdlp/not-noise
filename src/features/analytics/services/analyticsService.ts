
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsEvent, PageViewData, PlatformClickData } from '@/models/analytics';
import { sessionService } from '@/services/sessionService';
import { locationService } from '@/services/locationService';
import { browserDetectionService } from '@/services/browserDetectionService';

/**
 * Service for tracking and managing analytics data
 */
class AnalyticsService {
  /**
   * Track a page view
   */
  async trackPageView(url: string): Promise<void> {
    try {
      // Get session ID
      const sessionId = sessionService.getSessionId();
      
      // Get browser and device info
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      // Get location info if available
      const locationInfo = await locationService.getLocationInfo();
      
      console.log('[Analytics] Inserting page view into analytics_page_views table');
      
      const pageViewData: PageViewData = {
        url,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        ...browserInfo,
        ...locationInfo
      };
      
      const { error } = await supabase
        .from('analytics_page_views')
        .insert(pageViewData);
      
      if (error) {
        console.error('[Analytics] Error inserting page view:', error);
      }
    } catch (error) {
      console.error('[Analytics] Error tracking page view:', error);
    }
  }
  
  /**
   * Track a custom event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const sessionId = sessionService.getSessionId();
      
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: event.event_type,
          event_data: event.event_data,
          session_id: sessionId
        });
      
      if (error) {
        console.error('[Analytics] Error tracking event:', error);
      }
    } catch (error) {
      console.error('[Analytics] Error in trackEvent:', error);
    }
  }
  
  /**
   * Track platform link click
   */
  async trackPlatformClick(platformLinkId: string, smartLinkId?: string): Promise<void> {
    try {
      // Get session ID
      const sessionId = sessionService.getSessionId();
      
      // Get browser and device info
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      // Get location info if available
      const locationInfo = await locationService.getLocationInfo();
      
      const clickData: PlatformClickData = {
        platform_link_id: platformLinkId,
        smart_link_id: smartLinkId,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        ...browserInfo,
        ...locationInfo
      };
      
      const { error } = await supabase
        .from('platform_clicks')
        .insert(clickData);
      
      if (error) {
        console.error('[Analytics] Error tracking platform click:', error);
      }
    } catch (error) {
      console.error('[Analytics] Error in trackPlatformClick:', error);
    }
  }
  
  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName: string, metadata: Record<string, any> = {}): Promise<void> {
    return this.trackEvent({
      event_type: 'feature_usage',
      event_data: { 
        feature: featureName,
        ...metadata
      }
    });
  }
  
  /**
   * Record a successful or failed payment event
   */
  async trackPaymentEvent(successful: boolean, amount: number, productId: string, metadata: Record<string, any> = {}): Promise<void> {
    return this.trackEvent({
      event_type: 'payment_event',
      event_data: {
        successful,
        amount,
        product_id: productId,
        ...metadata
      }
    });
  }
}

export const analyticsService = new AnalyticsService();
