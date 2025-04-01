
/**
 * Simplified Google Analytics 4 utility
 * 
 * Handles only the essentials:
 * - Switching between measurement IDs
 * - Basic event tracking
 */

// Measurement IDs from the previous implementation
const MEASUREMENT_IDS = {
  main: 'G-2CFB508HGL',
  smartLinks: 'G-1XE9T2280Q'
} as const;

/**
 * Switches tracking to Smart Link measurement ID
 * Called when entering a Smart Link page
 */
export const switchToSmartLinkTracking = (): void => {
  if (typeof window !== 'undefined' && window.switchToSmartLinkTracking) {
    window.switchToSmartLinkTracking();
  }
};

/**
 * Track a custom event in Google Analytics
 */
export const trackEvent = (
  eventName: string, 
  params?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    console.log(`[GA4] Tracking event: ${eventName}`, params);
    gtag('event', eventName, params);
  }
};

// Add global type definition
declare global {
  interface Window {
    switchToSmartLinkTracking: () => void;
  }
}
