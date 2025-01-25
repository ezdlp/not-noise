import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: Function;
  }
}

export const useMetaPixel = () => {
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (window.fbq) {
      window.fbq('track', eventName, params);
    }
  };

  return { trackEvent };
};