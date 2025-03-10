
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';

/**
 * Hook to track page views and provide event tracking methods
 */
export function useAnalytics() {
  const location = useLocation();
  
  // Track page view when location changes
  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname]);
  
  // Memoized tracking methods
  const trackEvent = useCallback((eventType: string, eventData: Record<string, any> = {}) => {
    return analyticsService.trackEvent({
      event_type: eventType,
      event_data: eventData
    });
  }, []);
  
  const trackFeatureUsage = useCallback((feature: string, metadata: Record<string, any> = {}) => {
    return analyticsService.trackFeatureUsage(feature, metadata);
  }, []);
  
  const trackPlatformClick = useCallback((platformLinkId: string) => {
    return analyticsService.trackPlatformClick(platformLinkId);
  }, []);
  
  return {
    trackEvent,
    trackFeatureUsage,
    trackPlatformClick
  };
}
