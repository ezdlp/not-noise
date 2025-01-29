declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

import { supabase } from "@/integrations/supabase/client";

class AnalyticsService {
  private static instance: AnalyticsService;
  private gaInitialized = false;
  private fbInitialized = false;
  private gaId: string | null = null;
  private fbId: string | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize() {
    try {
      const { data: { GOOGLE_ANALYTICS_ID, META_PIXEL_ID } } = await supabase.functions.invoke('get-analytics-keys');
      this.gaId = GOOGLE_ANALYTICS_ID;
      this.fbId = META_PIXEL_ID;
    } catch (error) {
      console.error('Failed to fetch analytics keys:', error);
    }
  }

  initializeGA() {
    if (this.gaInitialized || !this.gaId) return;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.gaId);

    this.gaInitialized = true;
    console.log('Google Analytics initialized');
  }

  initializeFB() {
    if (this.fbInitialized || !this.fbId) return;

    (function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode?.insertBefore(t,s)})(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', this.fbId);
    window.fbq('track', 'PageView');

    this.fbInitialized = true;
    console.log('Meta Pixel initialized');
  }

  enableAnalytics() {
    this.initializeGA();
    this.initializeFB();
  }

  disableAnalytics() {
    // Remove GA
    const gaScript = document.querySelector(`script[src*="googletagmanager"]`);
    if (gaScript) {
      gaScript.remove();
    }
    this.gaInitialized = false;

    // Remove FB
    const fbScript = document.querySelector(`script[src*="facebook"]`);
    if (fbScript) {
      fbScript.remove();
    }
    this.fbInitialized = false;

    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();