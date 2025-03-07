
const MEASUREMENT_IDS = {
  main: 'G-2CFB508HGL',
  smartLinks: 'G-1XE9T2280Q'
} as const;

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface UserProperties {
  userId?: string;
  userType?: 'free' | 'pro';
  countryCode?: string;
  referrer?: string;
  firstVisit?: boolean;
}

class Analytics {
  private initialized = false;
  private isSmartLink = false;
  private userProperties: UserProperties = {};
  private lastTrackedPath: string | null = null;
  private lastTrackedTime: number = 0;
  private pageViewCount: number = 0;

  initialize(isSmartLink: boolean) {
    // If already initialized with the same type, don't reinitialize
    if (this.initialized && this.isSmartLink === isSmartLink) {
      console.log('[GA4 Analytics] Already initialized, skipping');
      return;
    }
    
    this.isSmartLink = isSmartLink;
    const measurementId = isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('[GA4 Analytics] Initializing GA4 with measurement ID:', measurementId);
    
    // Clear any existing GA configuration
    if (this.initialized) {
      console.log('[GA4 Analytics] Re-initializing GA4 with different measurement ID');
      // Reset GA state
      window.gtag('config', this.isSmartLink ? MEASUREMENT_IDS.main : MEASUREMENT_IDS.smartLinks, {
        'send_page_view': false
      });
    }
    
    // Configure the correct property
    gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually for better SPA support
      anonymize_ip: true
    });
    
    this.initialized = true;
    this.initializeSession();
  }

  private initializeSession() {
    const isFirstVisit = !localStorage.getItem('sr_first_visit');
    if (isFirstVisit) {
      localStorage.setItem('sr_first_visit', new Date().toISOString());
      console.log('[GA4 Analytics] First visit detected and recorded');
    }

    this.userProperties.firstVisit = isFirstVisit;
    this.userProperties.referrer = document.referrer;
    console.log('[GA4 Analytics] Session initialized with properties:', this.userProperties);
  }

  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    console.log('[GA4 Analytics] User properties updated:', this.userProperties);
    
    if (this.userProperties.userId) {
      console.log('[GA4 Analytics] Setting user_id in GA4:', this.userProperties.userId);
      gtag('set', 'user_properties', {
        user_id: this.userProperties.userId,
        user_type: this.userProperties.userType || 'free',
        country_code: this.userProperties.countryCode
      });
    }
  }

  trackPageView(path: string) {
    if (!this.initialized) {
      const isCurrentPathSmartLink = path.startsWith('/link/');
      console.log('[GA4 Analytics] Not initialized, initializing now for path:', path);
      this.initialize(isCurrentPathSmartLink);
    }

    // Implement de-duplication logic
    const now = Date.now();
    const isDuplicate = path === this.lastTrackedPath && (now - this.lastTrackedTime < 2000);
    
    if (isDuplicate) {
      console.log('[GA4 Analytics] Skipping duplicate page view within 2 seconds:', path);
      return;
    }

    this.pageViewCount++;
    this.lastTrackedPath = path;
    this.lastTrackedTime = now;

    const measurementId = this.isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('[GA4 Analytics] Tracking page view #' + this.pageViewCount + ' for:', path, 'to measurement ID:', measurementId);
    
    gtag('config', measurementId, {
      page_path: path,
      user_properties: this.userProperties
    });
  }

  trackEvent({ action, category, label, value, metadata }: AnalyticsEvent) {
    if (!this.initialized) {
      console.warn('Analytics not initialized when trying to track event');
      return;
    }

    console.log('Tracking event:', { action, category, label, value, metadata });

    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...this.userProperties,
      ...metadata
    });
  }

  // User Engagement Tracking
  trackActiveUser(duration: number) {
    this.trackEvent({
      action: 'active_user',
      category: 'Engagement',
      value: duration,
      metadata: {
        session_id: this.getSessionId(),
        is_returning: !this.userProperties.firstVisit
      }
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sr_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sr_session_id', sessionId);
    }
    return sessionId;
  }

  // Smart Link Creation Events
  trackSmartLinkCreationStep(step: number, succeeded: boolean, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'smart_link_creation_step',
      category: 'Smart Link',
      label: `Step ${step}${succeeded ? ' - Success' : ' - Failed'}`,
      metadata: {
        step_number: step,
        succeeded,
        session_id: this.getSessionId(),
        ...metadata
      }
    });
  }

  trackSmartLinkCreationComplete(platformCount: number, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'smart_link_created',
      category: 'Smart Link',
      value: platformCount,
      metadata: {
        session_id: this.getSessionId(),
        ...metadata
      }
    });
  }

  // Platform Events
  trackPlatformClick(platformName: string, smartLinkId: string) {
    this.trackEvent({
      action: 'platform_click',
      category: 'Platform Interaction',
      label: platformName,
      metadata: {
        smart_link_id: smartLinkId,
        platform: platformName,
        session_id: this.getSessionId()
      }
    });
  }

  // Feature Usage Events
  trackFeatureUsage(featureName: string, succeeded: boolean, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'feature_usage',
      category: 'Feature',
      label: featureName,
      metadata: {
        feature_name: featureName,
        succeeded,
        session_id: this.getSessionId(),
        user_type: this.userProperties.userType,
        ...metadata
      }
    });
  }

  // Pro Features
  trackProFeatureAttempt(featureName: string, subscribed: boolean) {
    this.trackEvent({
      action: 'pro_feature_attempt',
      category: 'Pro Features',
      label: featureName,
      metadata: {
        feature_name: featureName,
        subscribed,
        session_id: this.getSessionId(),
        user_type: this.userProperties.userType
      }
    });
  }

  // Subscription Events
  trackSubscriptionStart(plan: string, interval: 'monthly' | 'yearly') {
    this.trackEvent({
      action: 'subscription_started',
      category: 'Subscription',
      label: plan,
      metadata: {
        plan_name: plan,
        interval,
        session_id: this.getSessionId(),
        previous_user_type: this.userProperties.userType
      }
    });
  }

  // User Journey Events
  trackFeatureEngagement(featureName: string, duration: number, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'feature_engagement',
      category: 'User Journey',
      label: featureName,
      value: duration,
      metadata: {
        feature_name: featureName,
        session_id: this.getSessionId(),
        is_returning: !this.userProperties.firstVisit,
        ...metadata
      }
    });
  }

  // Conversion Events
  trackConversionEvent(action: string, metadata?: Record<string, any>) {
    this.trackEvent({
      action,
      category: 'Conversion',
      metadata: {
        session_id: this.getSessionId(),
        user_type: this.userProperties.userType,
        ...metadata
      }
    });
  }
}

export const analytics = new Analytics();
