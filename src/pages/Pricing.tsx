import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Crown, Star, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Pricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start checkout process");
    }
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
          <Card className="p-8 relative">
            <div className="flex flex-col h-full">
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

              <div className="space-y-6 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Smart Links</span>
                    </div>
                    <span className="text-sm font-medium">10 links</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Features included:</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
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
                      Custom URL Slugs
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Meta Pixel Integration
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline"
                className="mt-8"
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </Button>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-primary relative">
            <div className="absolute -top-3 right-4 bg-primary px-3 py-1 rounded-full text-white text-sm">
              Most Popular
            </div>
            <div className="flex flex-col h-full">
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
                      <span className="text-4xl font-bold">$50</span>
                      <span className="text-muted-foreground">/year</span>
                      <div className="text-sm text-primary mt-1">
                        $4.16/mo billed annually (Save 17%)
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Smart Links</span>
                    </div>
                    <span className="text-sm font-medium">Unlimited</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Everything in Free, plus:</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
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
                      Fan Email Collection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Remove Soundraiser Branding
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Priority Support (24/7 response within 12 hours)
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Bulk Analytics Export
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Smart Link Social Media Cards
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Early Access to New Features
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="mt-8 bg-primary hover:bg-primary/90"
                onClick={() => handleSubscribe(billingPeriod === 'monthly' ? 'price_1QmuqgFx6uwYcH3S7OiAn1Y7' : 'price_1QmuqgFx6uwYcH3SlOR5WTXM')}
              >
                Upgrade Now
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">
            Trusted by 10,000+ artists, including talent from major labels
          </h2>
          <TrustedLabels />
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

        <div className="mt-12 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <img src="/visa.svg" alt="Visa" className="h-8" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-8" />
            <img src="/amex.svg" alt="American Express" className="h-8" />
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
