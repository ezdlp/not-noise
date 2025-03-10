
/**
 * Google Analytics 4 integration service
 * 
 * Manages GA4 tracking across the application with simplified, consistent interfaces
 */

// Measurement IDs for different contexts
const MEASUREMENT_IDS = {
  main: 'G-2CFB508HGL',
  smartLinks: 'G-1XE9T2280Q'
} as const;

/**
 * Switches GA4 tracking to use the Smart Links measurement ID
 * Called when entering a Smart Link page
 */
export const switchToSmartLinkTracking = (): void => {
  if (typeof window !== 'undefined' && window.switchToSmartLinkTracking) {
    console.log('[GA4] Switching to Smart Link tracking');
    window.switchToSmartLinkTracking();
  }
};

/**
 * Track a custom event in Google Analytics 4
 * 
 * @param eventName - The name of the event to track
 * @param params - Optional parameters to include with the event
 */
export const trackEvent = (
  eventName: string, 
  params?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    console.log(`[GA4] Tracking event: ${eventName}`, params);
    gtag('event', eventName, params);
  } else {
    console.log(`[GA4] Unable to track event (gtag not available): ${eventName}`, params);
  }
};

/**
 * Track a page view in Google Analytics 4
 * 
 * @param path - The path to track
 * @param title - Optional page title
 */
export const trackPageView = (
  path: string,
  title?: string
): void => {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    console.log(`[GA4] Tracking page view: ${path}`);
    gtag('config', MEASUREMENT_IDS.main, {
      page_path: path,
      page_title: title
    });
  }
};

// Add global type definition
declare global {
  interface Window {
    switchToSmartLinkTracking: () => void;
    gtag: (...args: any[]) => void;
  }
}
