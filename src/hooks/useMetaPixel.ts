
import { useEffect } from "react";

export function useMetaPixel(metaPixelId: string | null | undefined, metaViewEvent: string | null | undefined) {
  useEffect(() => {
    if (metaPixelId) {
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
        fbq('init', metaPixelId);
        // @ts-ignore - fbq is added by the above script
        fbq('track', metaViewEvent || 'SmartLinkView');
      };

      initPixel();
    }
  }, [metaPixelId, metaViewEvent]);
}
