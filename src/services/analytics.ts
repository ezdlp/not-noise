
/**
 * Compatibility layer for the old analytics service
 * This file helps transition from the old analytics implementation to the new simplified GA4 setup
 * along with the internal analyticsService.
 */
import { analyticsService } from "@/services/analyticsService";
import { trackEvent, switchToSmartLinkTracking } from "@/services/ga4";

// Create a simplified version of the old analytics service API
export const analytics = {
  // Initialize tracking with appropriate GA4 property
  initialize: (isSmartLink: boolean = false) => {
    if (isSmartLink) {
      switchToSmartLinkTracking();
    }
    return Promise.resolve();
  },

  // Track page view
  trackPageView: (path: string) => {
    return analyticsService.trackPageView(path);
  },

  // Track events - forwards to both systems
  trackEvent: (data: any) => {
    // Map to GA4 format
    if (data.action) {
      trackEvent(data.action, {
        category: data.category,
        label: data.label,
        ...(data.value && { value: data.value })
      });
    }
    
    // Forward to internal analytics
    return analyticsService.trackEvent({
      event_type: data.action || 'custom_event',
      event_data: data
    });
  },

  // Forward to internal analytics
  trackFeatureUsage: (feature: string, success: boolean = true, metadata: Record<string, any> = {}) => {
    trackEvent('feature_usage', { 
      feature, 
      success, 
      ...metadata 
    });
    
    return analyticsService.trackFeatureUsage(feature, metadata);
  },

  // Track platform click with GA4 and internal analytics
  trackPlatformClick: (platform: string, linkId: string) => {
    trackEvent('platform_click', { platform, link_id: linkId });
    
    return analyticsService.trackPlatformClick(linkId);
  },

  // Smart link creation step tracking
  trackSmartLinkCreationStep: (step: number, completed: boolean, metadata: Record<string, any> = {}) => {
    trackEvent('smart_link_creation_step', { 
      step, 
      completed, 
      ...metadata 
    });
    
    return analyticsService.trackEvent({
      event_type: 'smart_link_creation_step',
      event_data: { step, completed, ...metadata }
    });
  },

  // Smart link creation complete tracking
  trackSmartLinkCreationComplete: (platformCount: number, metadata: Record<string, any> = {}) => {
    trackEvent('smart_link_creation_complete', { 
      platform_count: platformCount, 
      ...metadata 
    });
    
    return analyticsService.trackEvent({
      event_type: 'smart_link_creation_complete',
      event_data: { platform_count: platformCount, ...metadata }
    });
  },

  // Track feature engagement with GA4 and internal analytics
  trackFeatureEngagement: (feature: string, duration: number, metadata: Record<string, any> = {}) => {
    trackEvent('feature_engagement', { 
      feature, 
      duration, 
      ...metadata 
    });
    
    return analyticsService.trackEvent({
      event_type: 'feature_engagement',
      event_data: { feature, duration, ...metadata }
    });
  },

  // Track pro feature attempt
  trackProFeatureAttempt: (feature: string, success: boolean, metadata: Record<string, any> = {}) => {
    trackEvent('pro_feature_attempt', { 
      feature, 
      success, 
      ...metadata 
    });
    
    return analyticsService.trackEvent({
      event_type: 'pro_feature_attempt',
      event_data: { feature, success, ...metadata }
    });
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    trackEvent('set_user_properties', properties);
    return Promise.resolve();
  }
};
