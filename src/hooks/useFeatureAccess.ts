
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Feature = 'platform_reordering' | 'all_platforms' | 'email_capture' | 'social_assets' | 'meta_pixel';

const FREE_PLATFORMS = [
  'spotify',
  'appleMusic',
  'youtubeMusic',
  'amazonMusic',
  'deezer',
  'soundcloud',
  'youtube',
  'itunes'
];

export function useFeatureAccess() {
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ["feature-access-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      try {
        // First try to use active_subscriptions view (optimized)
        const { data: subscriptionData, error: viewError } = await supabase
          .from("active_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // If the view query fails or returns no results, fall back to the subscriptions table
        if (viewError || !subscriptionData) {
          console.log("Active subscriptions view error or no data, falling back to subscriptions table");
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();
            
          if (fallbackError) {
            console.error("Subscription fallback error:", fallbackError);
            return { tier: 'free' };
          }
          
          // Use fallback data if available
          const tier = fallbackData?.tier || 'free';
          
          // Get features for this tier
          const { data: features, error: featuresError } = await supabase
            .from("subscription_features")
            .select("*")
            .eq("tier", tier);
            
          if (featuresError) {
            console.error("Features error:", featuresError);
            return { tier };
          }
          
          return {
            ...fallbackData,
            features,
            tier
          };
        }
      
        // Default to free tier if no subscription data found
        const tier = subscriptionData?.tier || 'free';
        
        // Get features for this tier
        const { data: features, error: featuresError } = await supabase
          .from("subscription_features")
          .select("*")
          .eq("tier", tier);
          
        if (featuresError) {
          console.error("Features error:", featuresError);
          return { tier };
        }
        
        return {
          ...subscriptionData,
          features,
          tier
        };
      } catch (err) {
        console.error("Subscription error:", err);
        // If all else fails, default to free tier
        return { tier: 'free' };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const isFeatureEnabled = (feature: Feature): boolean => {
    if (!subscription) return false;
    
    if (feature === 'meta_pixel') {
      // Allow meta pixel if user is pro or if they're grandfathered in
      return subscription.tier === 'pro';
    }
    
    return subscription.tier !== 'free';
  };

  const getAvailablePlatforms = () => {
    // Return null (meaning all platforms are available) for Pro users
    if (subscription && subscription.tier !== 'free') {
      return null;
    }
    // Return limited platforms for free users
    return FREE_PLATFORMS;
  };

  return {
    isFeatureEnabled,
    getAvailablePlatforms,
    isLoading,
    error,
    subscription,
  };
}
