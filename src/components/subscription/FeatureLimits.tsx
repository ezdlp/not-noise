import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function FeatureLimits() {
  const { data: featureUsage } = useQuery({
    queryKey: ["featureUsage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the user's subscription tier first
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .single();

      if (subscriptionError) throw subscriptionError;

      // Get features for the user's tier
      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", subscription.tier);

      if (featuresError) throw featuresError;

      // Get current usage
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
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Feature Usage</h3>
      <div className="space-y-4">
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
            className="h-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm">Basic Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm">Advanced Analytics</span>
          </div>
        </div>
      </div>
    </Card>
  );
}