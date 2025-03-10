
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyticsService } from "@/services/analyticsService";
import { analytics } from "@/services/analytics";
import { locationService } from "@/services/locationService";
import { deviceInfoService } from "@/services/deviceInfoService";

export function useSmartLinkTracking(slug: string | undefined, smartLinkId: string | undefined) {
  // Initialize analytics
  useEffect(() => {
    if (slug) {
      analytics.initialize(true);
      analytics.trackPageView(`/link/${slug}`);
    }
  }, [slug]);

  // Track view mutation
  const recordViewMutation = useMutation({
    mutationFn: async (linkId: string) => {
      try {
        if (slug) {
          await analyticsService.trackPageView(`/link/${slug}`);
        }
        
        const locationInfo = await locationService.getLocationInfo();
        const deviceInfo = deviceInfoService.getDeviceInfo();
        
        await supabase.from('link_views').insert({
          smart_link_id: linkId,
          user_agent: deviceInfo.user_agent,
          country_code: locationInfo?.country_code,
          ip_hash: locationInfo?.ip_hash,
          browser_name: deviceInfo.browser_name,
          browser_version: deviceInfo.browser_version,
          os_name: deviceInfo.os_name,
          os_version: deviceInfo.os_version,
          device_type: deviceInfo.device_type,
          screen_width: deviceInfo.screen_width,
          screen_height: deviceInfo.screen_height
        });

        console.log('View recorded successfully with location:', locationInfo?.country_code, 'and device:', deviceInfo.device_type);
      } catch (error) {
        console.error('Error recording view:', error);
      }
    }
  });

  // Record view when smart link ID is available
  useEffect(() => {
    if (smartLinkId) {
      recordViewMutation.mutate(smartLinkId);
    }
  }, [smartLinkId]);

  // Handle platform click
  const handlePlatformClick = async (platformLinkId: string, smartLink: any) => {
    if (!smartLink) return;

    try {
      console.log('Recording platform click for ID:', platformLinkId);
      
      analytics.trackPlatformClick(smartLink.platform_name || 'Unknown', smartLink.id);
      
      await analyticsService.trackPlatformClick(platformLinkId);
      console.log('Platform click recorded successfully');

      if (smartLink.meta_pixel_id) {
        // @ts-ignore - fbq is added by the Meta Pixel script
        fbq('track', smartLink.meta_click_event || 'SmartLinkClick');
      }
    } catch (error) {
      console.error('Error in handlePlatformClick:', error);
    }
  };

  return {
    handlePlatformClick
  };
}
