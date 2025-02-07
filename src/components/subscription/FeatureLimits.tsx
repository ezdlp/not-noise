
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Link2, CheckCircle2, Music2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
        tier: subscription.tier
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

  const isPro = featureUsage.tier === 'pro';
  const isUnlimited = smartLinksLimit === -1;

  return (
    <>
      <CollapsibleTrigger className="w-full border-t border-border">
        <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
            View Plan Features
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 px-6 pb-6 border-t pt-6">
        <div className="space-y-4">
          {/* Smart Links Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                <span className="text-sm">Smart Links</span>
              </div>
              <span className="text-sm font-medium">
                {smartLinksUsed}/{isUnlimited ? "∞" : smartLinksLimit}
              </span>
            </div>
            <Progress
              value={isUnlimited ? 0 : (smartLinksUsed / smartLinksLimit) * 100}
              className="h-3 bg-[#D0C7FF]"
            />
          </div>

          {/* Available Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Available Features</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Basic Analytics (Views, Clicks, CTR)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Basic Platforms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Custom URL Slugs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Meta Pixel Integration</span>
              </div>
              {isPro && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Fan Email Collection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Platform Reordering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Advanced Analytics (click per streaming platform, daily performance, fan locations, trends)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Remove Soundraiser Branding</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pro Features - Only show if not Pro */}
          {!isPro && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-2">Pro Features</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Fan Email Collection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Platform Reordering</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Advanced Analytics (click per streaming platform, daily performance, fan locations, trends)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Remove Soundraiser Branding</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Platforms */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Additional Platforms</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Tidal', 'Beatport', 'Bandcamp', 'Napster',
                'Anghami', 'Boomplay', 'Yandex Music', 'Audius'
              ].map((platform) => (
                <div key={platform} className="flex items-center gap-2">
                  {isPro ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">{platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </>
  );
}
