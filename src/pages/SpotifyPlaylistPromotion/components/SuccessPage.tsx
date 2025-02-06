
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface PromotionDetails {
  trackName: string;
  trackArtist: string;
  submissionCount: number;
  estimatedAdditions: number;
}

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [promotionDetails, setPromotionDetails] = useState<PromotionDetails | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/spotify-playlist-promotion');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.promotion) {
          setPromotionDetails({
            trackName: data.promotion.trackName,
            trackArtist: data.promotion.trackArtist,
            submissionCount: data.promotion.submissionCount,
            estimatedAdditions: data.promotion.estimatedAdditions,
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Error",
          description: "There was an error verifying your payment. Please contact support.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6851fb]">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-700">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#6851fb] p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg 
              className="h-8 w-8 text-emerald-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          
          {promotionDetails && (
            <div className="space-y-4 w-full">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="font-semibold text-lg text-gray-900 mb-4">Promotion Details</h2>
                <div className="space-y-2 text-left">
                  <p className="text-gray-600">Track: <span className="font-medium text-gray-900">{promotionDetails.trackName}</span></p>
                  <p className="text-gray-600">Artist: <span className="font-medium text-gray-900">{promotionDetails.trackArtist}</span></p>
                  <p className="text-gray-600">Submissions: <span className="font-medium text-gray-900">{promotionDetails.submissionCount}</span></p>
                  <p className="text-gray-600">Estimated Additions: <span className="font-medium text-gray-900">{promotionDetails.estimatedAdditions}</span></p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 w-full">
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-2 text-sm">
                <li>Our team will review your track within 24 hours</li>
                <li>You'll receive an email with your promotion strategy</li>
                <li>Track your promotion progress in your dashboard</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => navigate('/spotify-playlist-promotion')}
              className="w-full"
            >
              Return to Promotion Page
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Need help? <a href="/contact" className="text-primary hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
