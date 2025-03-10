
import { useEffect } from 'react';
import { useMetaPixel } from '@/hooks/useMetaPixel';
import { analyticsService } from '@/features/analytics/services/analyticsService';
import { trackEvent, switchToSmartLinkTracking } from '@/services/ga4';

/**
 * Hook to handle all tracking related to a smart link view
 */
export function useSmartLinkTracking(smartLink: any) {
  // Initialize Meta Pixel if configured
  useMetaPixel(
    smartLink?.meta_pixel_id, 
    smartLink?.meta_view_event
  );

  // Track smart link view once when component mounts
  useEffect(() => {
    if (!smartLink) return;

    const trackSmartLinkView = async () => {
      try {
        // Initialize analytics for smart links
        switchToSmartLinkTracking();

        // Track in GA4
        trackEvent('smart_link_view', {
          smart_link_id: smartLink.id,
          title: smartLink.title,
          artist: smartLink.artist,
          url: window.location.href
        });

        // Track in Supabase
        await analyticsService.trackEvent({
          event_type: 'smart_link_view',
          event_data: {
            smart_link_id: smartLink.id,
            title: smartLink.title,
            artist: smartLink.artist,
            url: window.location.href
          }
        });

        console.log(`[SmartLink] Tracked view for: ${smartLink.title} by ${smartLink.artist}`);
      } catch (error) {
        console.error('[SmartLink] Error tracking view:', error);
      }
    };

    trackSmartLinkView();
  }, [smartLink]);

  // Return function to track platform clicks
  const trackPlatformClick = async (platformLinkId: string) => {
    if (!smartLink) return;
    
    try {
      // Track in Supabase
      await analyticsService.trackPlatformClick(platformLinkId, smartLink.id);
      
      // Track in GA4
      trackEvent('platform_click', { 
        platform_link_id: platformLinkId,
        smart_link_id: smartLink.id
      });
      
      console.log(`[SmartLink] Tracked click for platform link: ${platformLinkId}`);
    } catch (error) {
      console.error('[SmartLink] Error tracking platform click:', error);
    }
  };

  return {
    trackPlatformClick
  };
}
