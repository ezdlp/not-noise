
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
  const { data: subscription } = useQuery({
    queryKey: ["feature-access-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all subscriptions for this user to handle the case of multiple subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order('tier', { ascending: false }) // Put 'pro' before 'free'
        .order('status', { ascending: false }) // Put 'active' before other statuses
        .order('billing_period', { ascending: false }); // Put 'annual' before 'monthly'

      if (subscriptionsError) throw subscriptionsError;
      
      // Find the best subscription (prioritizing pro, active, and annual)
      const activeProSub = subscriptionsData?.find(sub => 
        sub.tier === 'pro' && sub.status === 'active'
      );
      
      const anyProSub = subscriptionsData?.find(sub => sub.tier === 'pro');
      const bestSub = activeProSub || anyProSub || subscriptionsData?.[0];
      
      // Default to free tier if no subscription data found
      const tier = bestSub?.tier || 'free';
      
      // Get features for this tier
      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", tier);
        
      if (featuresError) throw featuresError;
      
      return {
        ...bestSub,
        features,
        tier,
        // For debugging purposes
        all_subscriptions: subscriptionsData
      };
    },
    // Add these options to prevent constant refetching
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const isFeatureEnabled = (feature: Feature): boolean => {
    if (!subscription) return false;
    
    if (feature === 'meta_pixel') {
      // Allow meta pixel if user is pro or if they're grandfathered in
      return subscription.tier === 'pro' || subscription.meta_pixel_grandfathered === true;
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
    isLoading: !subscription,
    subscription,
  };
}
