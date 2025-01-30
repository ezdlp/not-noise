import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();

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
        <p className="text-lg text-muted-foreground">
          Get started with our Pro plan and unlock all features
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Monthly Plan */}
        <Card className="p-8">
          <div className="flex flex-col h-full">
            <div>
              <h3 className="text-2xl font-bold">Pro Plan</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold">$19</span>
                <span className="ml-1 text-xl text-muted-foreground">/month</span>
              </div>
              <p className="mt-4 text-muted-foreground">
                Perfect for growing artists and musicians
              </p>
            </div>

            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Unlimited Smart Links</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Custom Domains</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Priority Support</span>
              </li>
            </ul>

            <Button 
              className="mt-8 bg-primary hover:bg-primary/90"
              onClick={() => handleSubscribe('price_1QmuqgFx6uwYcH3S7OiAn1Y7')}
            >
              Subscribe Monthly
            </Button>
          </div>
        </Card>

        {/* Annual Plan */}
        <Card className="p-8 border-primary">
          <div className="flex flex-col h-full">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Pro Plan</h3>
                <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
                  Save 20%
                </span>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold">$180</span>
                <span className="ml-1 text-xl text-muted-foreground">/year</span>
              </div>
              <p className="mt-4 text-muted-foreground">
                Best value for serious artists
              </p>
            </div>

            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>All Monthly Plan Features</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>2 Months Free</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Priority Email Support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Early Access to New Features</span>
              </li>
            </ul>

            <Button 
              className="mt-8 bg-primary hover:bg-primary/90"
              onClick={() => handleSubscribe('price_1QmuqgFx6uwYcH3SlOR5WTXM')}
            >
              Subscribe Yearly
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}