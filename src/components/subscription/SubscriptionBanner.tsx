
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { FeatureLimits } from "./FeatureLimits";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

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

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      try {
        // First try active_subscriptions view
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
            
          if (fallbackError && fallbackError.code !== 'PGRST116') {
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
          }
          
          return {
            tier,
            is_early_adopter: fallbackData?.is_early_adopter || false,
            features: features || []
          };
        }
      
        // Default to free tier if no subscription is found
        const tier = subscriptionData?.tier || 'free';

        const { data: features, error: featuresError } = await supabase
          .from("subscription_features")
          .select("*")
          .eq("tier", tier);

        if (featuresError) {
          console.error("Features error:", featuresError);
        }

        return {
          tier,
          is_early_adopter: subscriptionData?.is_early_adopter || false,
          features: features || []
        };
      } catch (err) {
        console.error("Error fetching subscription status:", err);
        toast({
          variant: "destructive",
          title: "Error fetching subscription status",
          description: "Please try refreshing the page"
        });
        return { tier: 'free', features: [] };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Don't show anything while loading
  if (isLoading) return null;

  // Don't show for pro users
  if (subscription?.tier === 'pro') return null;

  const handleUpgradeClick = () => {
    navigate("/pricing");
  };

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
                Free Plan
                {subscription?.is_early_adopter && (
                  <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded-full">
                    Early Adopter
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock all features
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-primary hover:bg-primary/5 text-primary"
            onClick={handleUpgradeClick}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <FeatureLimits />
      </Collapsible>
    </div>
  );
}
