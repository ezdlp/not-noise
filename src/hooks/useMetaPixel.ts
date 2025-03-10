
import { useEffect } from "react";

/**
 * Hook to initialize and track Meta Pixel events for smart links
 * @param metaPixelId - The Meta Pixel ID to initialize
 * @param metaViewEvent - Optional custom event name (defaults to 'SmartLinkView')
 */
export function useMetaPixel(metaPixelId: string | null | undefined, metaViewEvent: string | null | undefined) {
  useEffect(() => {
    if (!metaPixelId) return;
    
    try {
      const initPixel = () => {
        // @ts-ignore - This code is from Facebook and needs to use their specific format
        (function(f,b,e,v,n,t,s) {
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)})(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
        // @ts-ignore - fbq is added by the above script
        window.fbq('init', metaPixelId);
        
        // Track the view event
        // @ts-ignore - fbq is added by the above script
        window.fbq('track', metaViewEvent || 'SmartLinkView');
        
        console.log(`Meta Pixel initialized with ID: ${metaPixelId}`);
      };

      initPixel();
    } catch (error) {
      console.error('Error initializing Meta Pixel:', error);
    }
  }, [metaPixelId, metaViewEvent]);
}
