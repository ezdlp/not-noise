
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Feature = 'platform_reordering' | 'all_platforms' | 'email_capture' | 'social_assets';

const FREE_PLATFORMS = ['spotify', 'youtubeMusic', 'appleMusic', 'amazonMusic', 'deezer'];

export function useFeatureAccess() {
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, subscription_features!inner(*)")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const isFeatureEnabled = (feature: Feature): boolean => {
    if (!subscription) return false;
    return subscription.tier !== 'free';
  };

  const getAvailablePlatforms = () => {
    if (!subscription || subscription.tier === 'free') {
      return FREE_PLATFORMS;
    }
    return null; // null means all platforms are available
  };

  return {
    isFeatureEnabled,
    getAvailablePlatforms,
    isLoading: !subscription,
    subscription,
  };
}
