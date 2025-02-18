
const MEASUREMENT_IDS = {
  main: 'G-2CFB508HGL',
  smartLinks: 'G-1XE9T2280Q'
} as const;

class Analytics {
  private initialized = false;

  initialize(isSmartLink: boolean) {
    if (this.initialized) return;
    
    const measurementId = isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('Initializing GA4 with measurement ID:', measurementId);
    
    gtag('config', measurementId, {
      send_page_view: false // We'll handle page views manually for better SPA support
    });
    
    this.initialized = true;
  }

  trackPageView(path: string, isSmartLink: boolean) {
    const measurementId = isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('Tracking page view:', { path, measurementId });
    
    gtag('config', measurementId, {
      page_path: path
    });
  }
}

export const analytics = new Analytics();
