import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckCircleIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PromotionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the session ID from URL params
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          console.error('No session ID found in URL');
          setIsProcessing(false);
          return;
        }

        // Verify the payment session using the Edge Function
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: { sessionId }
        });

        if (error || !data?.success) {
          console.error('Error verifying payment:', error || 'Payment not successful');
          setIsProcessing(false);
          return;
        }

        // Show success message
        setSuccess(true);
        setIsProcessing(false);
        
        // Show success toast
        toast.success('Your promotion campaign has been created successfully!');
        
        // Redirect to the dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard?section=promotions');
        }, 2000);
      } catch (error) {
        console.error('Error processing promotion:', error);
        setIsProcessing(false);
      }
    };
    
    verifyPayment();
  }, [navigate, searchParams]);
  
  return (
    <div className="container py-12 px-4 max-w-lg mx-auto">
      <Card className="p-8 text-center">
        <CardContent className="p-0">
          {isProcessing ? (
            <>
              <div className="mx-auto mb-4">
                <Loader2Icon className="h-12 w-12 animate-spin text-primary mx-auto" />
              </div>
              <h1 className="text-xl font-medium mb-4">Processing your promotion...</h1>
              <p className="text-muted-foreground mb-4">
                Please wait while we set up your Spotify playlist promotion campaign.
              </p>
            </>
          ) : success ? (
            <>
              <div className="mx-auto mb-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
              </div>
              <h1 className="text-xl font-medium mb-4">Promotion Created Successfully!</h1>
              <p className="text-muted-foreground mb-6">
                Your Spotify playlist promotion has been set up and our team will start
                working on it right away. You'll be redirected to your dashboard.
              </p>
              <Link to="/dashboard?section=promotions">
                <Button>Go to Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-medium mb-4">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't process your promotion at this time. Please contact support
                for assistance.
              </p>
              <Link to="/dashboard?section=promotions">
                <Button>Go to Dashboard</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 