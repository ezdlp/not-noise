import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

        {/* Billing Toggle */}
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
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-2xl font-bold">Free Plan</h3>
                </div>
                <p className="text-muted-foreground">
                  Perfect for getting started
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

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Available Features</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Basic Analytics (Views, Clicks, CTR)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Basic Platforms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Custom URL Slugs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Meta Pixel Integration</span>
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
                  For creators who want more
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

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Everything in Free, plus:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All Platforms + Platform Reordering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Advanced Analytics (platform-specific clicks, daily performance, fan locations)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Fan Email Collection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Remove Soundraiser Branding</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Additional Platforms</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Tidal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Beatport</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Bandcamp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Napster</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Anghami</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Boomplay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Yandex Music</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Audius</span>
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
      </div>
    </div>
  );
}