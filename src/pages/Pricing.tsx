
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Crown, Star, Info, Check, ShieldCheck, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCcVisa, faCcMastercard, faCcAmex } from "@fortawesome/free-brands-svg-icons";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  // Query the user's current session
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Query the user's subscription with proper error handling
  const { data: subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ["subscription", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*, subscription_features(*)")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Subscription fetch error:", error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Subscription query error:", error);
        toast.error("Failed to load subscription data. Please try again.");
        return null;
      }
    },
    enabled: !!session?.user,
    retry: 2,
  });

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(true);
      
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId,
          isSubscription: true
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error("Failed to start checkout process. Please try again.");
        return;
      }

      if (!data?.url) {
        console.error('No checkout URL received:', data);
        toast.error("Unable to create checkout session. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreePlanAction = () => {
    if (!session) {
      navigate("/login");
      return;
    }
    
    // If user is already on free plan, do nothing
    if (subscription?.tier === 'free') {
      return;
    }

    // Navigate to dashboard if they're already logged in
    navigate("/dashboard");
  };

  // Function to render the appropriate button or label based on subscription status
  const renderActionButton = (tier: 'free' | 'pro') => {
    // Show loading state while data is being fetched
    if (isSessionLoading || isSubscriptionLoading) {
      return (
        <div className="w-full px-4 py-2 text-center text-sm font-medium text-muted-foreground bg-muted rounded-md animate-pulse">
          Loading...
        </div>
      );
    }

    // Handle subscription error state
    if (subscriptionError) {
      return (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      );
    }

    // For free tier
    if (tier === 'free') {
      // Show "Current Plan" if we have confirmed the user is on free plan
      if (subscription?.tier === 'free') {
        return (
          <div className="w-full px-4 py-2 text-center text-sm font-medium text-muted-foreground bg-muted rounded-md">
            Current Plan
          </div>
        );
      }
      return (
        <Button 
          variant="outline"
          onClick={handleFreePlanAction}
          className="w-full"
        >
          {!session ? "Get Started Free" : "Get Started"}
        </Button>
      );
    }

    // For Pro plan
    if (subscription?.tier === 'pro') {
      return (
        <div className="w-full px-4 py-2 text-center text-sm font-medium text-muted-foreground bg-muted rounded-md">
          Current Plan
        </div>
      );
    }

    return (
      <Button 
        className="w-full bg-primary hover:bg-primary/90"
        onClick={() => handleSubscribe(billingPeriod === 'monthly' ? 'price_1QmuqgFx6uwYcH3S7OiAn1Y7' : 'price_1QmuqgFx6uwYcH3SlOR5WTXM')}
        disabled={isLoading}
      >
        {isLoading ? "Preparing..." : "Upgrade Now"}
      </Button>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start with our Free plan or upgrade to Pro for unlimited features
        </p>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>
            Monthly billing
          </span>
          <Switch
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          />
          <span className={billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}>
            Annual billing <span className="text-primary text-sm">(Save 17%)</span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 relative flex flex-col">
            <div className="flex-1">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="text-2xl font-bold">Free Plan</h3>
                </div>
                <p className="text-muted-foreground">
                  Perfect for emerging artists
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Features included:</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      Up to 10 Smart Links
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        Basic Analytics
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Views, Clicks, and CTR tracking
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        Basic Streaming Platforms
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Spotify, Apple Music, YouTube Music, Amazon Music, Deezer, Soundcloud, YouTube, iTunes Store
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      Custom URL Slugs
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Meta Pixel Integration
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {renderActionButton('free')}
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-primary relative flex flex-col">
            <div className="absolute -top-3 right-4 bg-primary px-3 py-1 rounded-full text-white text-sm">
              Most Popular
            </div>
            <div className="flex-1">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-2xl font-bold">Pro Plan</h3>
                </div>
                <p className="text-muted-foreground">
                  For artists who want more
                </p>
                <div className="mt-4">
                  {billingPeriod === 'monthly' ? (
                    <>
                      <span className="text-4xl font-bold">$4.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">$4.16</span>
                      <span className="text-muted-foreground">/mo</span>
                      <div className="text-sm text-primary mt-1">
                        billed annually (Save 17%)
                      </div>
                    </>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">Cancel anytime</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Everything in Free, plus:</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Unlimited Smart Links
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <div className="flex items-center gap-2">
                        All Streaming Platforms + Reordering
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Spotify, Apple Music, YouTube Music, Amazon Music, Deezer, Soundcloud, YouTube, iTunes Store, Tidal, Beatport, Bandcamp, Napster, Anghami, Boomplay, Yandex Music, Audius
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <div className="flex items-center gap-2">
                        Advanced Analytics
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Platform-specific clicks, daily performance, and fan locations
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Fan Email Collection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Remove Soundraiser Branding
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Priority Support (24/7 response within 12 hours)
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Bulk Analytics Export
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Smart Link Social Media Cards
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Early Access to New Features
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {renderActionButton('pro')}
            </div>
          </Card>
        </div>

        <div className="mt-16">
          <TrustedLabels isPricingPage={true} />
        </div>

        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6 text-left">
            <div>
              <h4 className="font-medium mb-2">Can I upgrade anytime?</h4>
              <p className="text-muted-foreground">Yes, you can upgrade to Pro at any time and immediately access all premium features.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What happens if I exceed the free plan limits?</h4>
              <p className="text-muted-foreground">You'll need to upgrade to Pro to create more smart links, but your existing links will continue to work.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Can I cancel anytime?</h4>
              <p className="text-muted-foreground">Yes, you can cancel your Pro subscription at any time. Your premium features will remain active until the end of your billing period.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center space-y-8">
          <div className="flex items-center gap-6">
            <FontAwesomeIcon 
              icon={faCcVisa} 
              className="h-8 w-auto text-[#4F4F4F] transition-colors hover:text-[#0F0F0F]" 
            />
            <FontAwesomeIcon 
              icon={faCcMastercard} 
              className="h-8 w-auto text-[#4F4F4F] transition-colors hover:text-[#0F0F0F]" 
            />
            <FontAwesomeIcon 
              icon={faCcAmex} 
              className="h-8 w-auto text-[#4F4F4F] transition-colors hover:text-[#0F0F0F]" 
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-success hover:text-success-hover transition-colors">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-success hover:text-success-hover transition-colors">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">SSL Encryption</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Need help choosing?</span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/contact")}>
              Contact our team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
