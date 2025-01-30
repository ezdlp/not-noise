import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Link2, CheckCircle2, XCircle, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CollapsibleContent } from "@/components/ui/collapsible";

export function FeatureLimits() {
  const { data: featureUsage } = useQuery({
    queryKey: ["featureUsage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .single();

      if (subscriptionError) throw subscriptionError;

      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", subscription.tier);

      if (featuresError) throw featuresError;

      const { data: usage, error: usageError } = await supabase
        .from("feature_usage")
        .select("*")
        .eq("user_id", user.id);

      if (usageError) throw usageError;

      return {
        features,
        usage: usage || [],
      };
    },
  });

  if (!featureUsage) return null;

  const smartLinksLimit = featureUsage.features.find(
    (f) => f.feature_name === "smart_links"
  )?.feature_limit || 0;

  const smartLinksUsed = featureUsage.usage.find(
    (u) => u.feature_name === "smart_links"
  )?.usage_count || 0;

  return (
    <CollapsibleContent className="space-y-6 px-6 pb-6">
      <div className="space-y-4">
        {/* Smart Links Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="text-sm">Smart Links</span>
            </div>
            <span className="text-sm font-medium">
              {smartLinksUsed}/{smartLinksLimit}
            </span>
          </div>
          <Progress
            value={(smartLinksUsed / smartLinksLimit) * 100}
            className="h-2 bg-[#D0C7FF]"
          />
        </div>

        {/* Available Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium mb-2">Available Features</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">Basic Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">Basic Platforms</span>
            </div>
          </div>
        </div>

        {/* Locked Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium mb-2">Pro Features (Locked)</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Fan Email Collection</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Meta Pixel Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Custom URL Slugs</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Platform Reordering</span>
            </div>
          </div>
        </div>

        {/* Additional Platforms */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium mb-2">Additional Platforms (Locked)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="text-sm">Tidal</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="text-sm">Anghami</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="text-sm">Napster</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="text-sm">Beatport</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="text-sm">Boomplay</span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleContent>
  );
}