
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    switchToSmartLinkTracking: () => void;
  }
}

// Switch to the smart link GA4 property
export const switchToSmartLinkTracking = () => {
  if (typeof window !== 'undefined' && window.switchToSmartLinkTracking) {
    window.switchToSmartLinkTracking();
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      send_to: 'G-2CFB508HGL',
    });
  }
};

// Track smart link views
export const trackSmartLinkView = (linkId: string, title: string, artist: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // First switch to smart link tracking
    switchToSmartLinkTracking();
    
    // Then track the specific event
    window.gtag('event', 'smart_link_view', {
      link_id: linkId,
      title: title,
      artist: artist,
      send_to: 'G-1XE9T2280Q',
    });
  }
};

// Track platform clicks
export const trackPlatformClick = (platform: string, linkId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'platform_click', {
      platform: platform,
      link_id: linkId,
      send_to: 'G-1XE9T2280Q',
    });
  }
};

// Track email subscriptions
export const trackEmailSubscription = (linkId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'email_subscription', {
      link_id: linkId,
      send_to: 'G-1XE9T2280Q',
    });
  }
};

export default {
  switchToSmartLinkTracking,
  trackPageView,
  trackSmartLinkView,
  trackPlatformClick,
  trackEmailSubscription,
};
