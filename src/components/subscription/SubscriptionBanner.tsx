
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { FeatureLimits } from "./FeatureLimits";
import { useNavigate } from "react-router-dom";

export function SubscriptionBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Load initial state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("featureLimitsOpen");
    setIsOpen(stored === "true");
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem("featureLimitsOpen", isOpen.toString());
  }, [isOpen]);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;
      
      const tier = subscriptionData?.tier || 'free';

      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", tier);

      if (featuresError) throw featuresError;

      return {
        tier,
        is_early_adopter: subscriptionData?.is_early_adopter || false,
        features
      };
    },
  });

  // Hide banner while loading or if no subscription data
  if (isLoading) return null;
  
  // Hide banner for pro users
  if (subscription?.tier === 'pro') return null;

  const isFreeTier = subscription?.tier === "free";
  const isEarlyAdopter = subscription?.is_early_adopter;

  const handleUpgradeClick = () => {
    navigate("/pricing");
  };

  // Only show banner for free tier users
  if (!isFreeTier) return null;

  return (
    <div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-neutral-seasalt">
              <Crown className="w-5 h-5 text-neutral-night/60" />
            </div>
            <div>
              <h3 className="font-semibold capitalize">
                {subscription?.tier} Plan
                {isEarlyAdopter && (
                  <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded-full">
                    Early Adopter
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isFreeTier
                  ? "Upgrade to unlock all features"
                  : "Thanks for supporting us!"}
              </p>
            </div>
          </div>
          {isFreeTier && (
            <Button 
              variant="outline" 
              className="border-primary hover:bg-primary/5 text-primary"
              onClick={handleUpgradeClick}
            >
              Upgrade Now
            </Button>
          )}
        </div>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <FeatureLimits />
      </Collapsible>
    </div>
  );
}
