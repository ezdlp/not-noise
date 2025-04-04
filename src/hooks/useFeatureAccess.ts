
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
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["feature-access-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use active_subscriptions view which only returns active subscriptions
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("active_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();  // Use maybeSingle instead of single to handle case of no subscription

      if (subscriptionError) {
        console.log("Subscription error:", subscriptionError);
        return { tier: 'free' };
      }
      
      // Default to free tier if no subscription data found
      const tier = subscriptionData?.tier || 'free';
      
      // Get features for this tier
      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", tier);
        
      if (featuresError) throw featuresError;
      
      return {
        ...subscriptionData,
        features,
        tier
      };
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
    subscription,
  };
}
