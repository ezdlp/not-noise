
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

class Analytics {
  private initialized = false;
  private measurementId: string | null = null;

  initialize(isSmartLink: boolean) {
    if (this.initialized) return;
    
    this.measurementId = isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('Initializing GA4 with measurement ID:', this.measurementId);
    
    gtag('config', this.measurementId, {
      send_page_view: false // We'll handle page views manually for better SPA support
    });
    
    this.initialized = true;
  }

  trackPageView(path: string, isSmartLink: boolean) {
    if (!this.initialized) {
      console.warn('Analytics not initialized when trying to track page view');
      return;
    }

    const measurementId = isSmartLink ? MEASUREMENT_IDS.smartLinks : MEASUREMENT_IDS.main;
    console.log('Tracking page view:', { path, measurementId });
    
    gtag('config', measurementId, {
      page_path: path
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
      ...metadata
    });
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
        ...metadata
      }
    });
  }

  trackSmartLinkCreationComplete(platformCount: number, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'smart_link_created',
      category: 'Smart Link',
      value: platformCount,
      metadata
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
        platform: platformName
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
        subscribed
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
        interval
      }
    });
  }

  // User Engagement
  trackEngagement(action: string, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'user_engagement',
      category: 'Engagement',
      label: action,
      metadata
    });
  }
}

export const analytics = new Analytics();
