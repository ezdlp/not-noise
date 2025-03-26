
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

  // Try to get last promotion details from localStorage (as a fallback)
  const getLastPromotionFromStorage = () => {
    try {
      const storedData = localStorage.getItem('lastPromotionTrack');
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (e) {
      console.warn('Error retrieving last promotion from localStorage:', e);
    }
    return null;
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('No session ID found in URL. Redirecting to promotion page...');
      setTimeout(() => {
        navigate('/spotify-playlist-promotion');
      }, 3000);
      return;
    }

    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: { sessionId }
        });

        if (error) {
          console.error('Error invoking verify-payment-session function:', error);
          throw new Error(error.message || 'Failed to verify payment');
        }

        if (!data?.success) {
          // If the payment verification failed but we have less than max retries, try again
          if (retries < maxRetries) {
            console.log(`Payment verification attempt ${retries + 1} failed, retrying...`);
            setRetries(prev => prev + 1);
            setTimeout(verifyPayment, 2000); // Retry after 2 seconds
            return;
          }
          throw new Error(data?.message || 'Payment verification failed');
        }

        if (data?.promotion) {
          setPromotionDetails({
            trackName: data.promotion.trackName,
            trackArtist: data.promotion.trackArtist,
            submissionCount: data.promotion.submissionCount,
            estimatedAdditions: data.promotion.estimatedAdditions,
          });
          
          // Clear localStorage data now that we have confirmed details
          localStorage.removeItem('lastPromotionTrack');
        } else {
          // If we don't have promotion details from the verification,
          // try to get them from localStorage as a fallback
          const lastPromotion = getLastPromotionFromStorage();
          if (lastPromotion) {
            // This is just approximate data from what the user selected
            setPromotionDetails({
              trackName: lastPromotion.title,
              trackArtist: lastPromotion.artist,
              submissionCount: lastPromotion.packageId === 'silver' ? 20 : 
                              lastPromotion.packageId === 'gold' ? 35 : 50,
              estimatedAdditions: lastPromotion.packageId === 'silver' ? 5 : 
                                lastPromotion.packageId === 'gold' ? 8 : 12,
            });
          } else {
            setError('Payment successful, but promotion details could not be retrieved.');
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        toast({
          title: "Verification Error",
          description: "There was a problem verifying your payment. Please contact support for assistance.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [navigate, searchParams, retries]);

  const handleTryAgain = () => {
    setError(null);
    setRetries(0);
    // Force re-run the verification effect
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setIsLoading(true);
      // This will trigger the useEffect again
      setRetries(0);
    } else {
      navigate('/spotify-playlist-promotion');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6851fb]">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-700">
              {retries > 0 ? `Verifying your payment (attempt ${retries}/${maxRetries})...` : 'Verifying your payment...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6851fb] p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">Verification Error</h1>
            
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-4 w-full">
              <Button 
                onClick={handleTryAgain}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={() => navigate('/spotify-playlist-promotion')}
                variant="outline"
                className="w-full"
              >
                Return to Promotion Page
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              If this error persists, please <a href="/contact" className="text-primary hover:underline">contact our support team</a> with your payment details.
            </p>
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
                <li>Our team will review your track and begin crafting your campaign</li>
                <li>We will reach out to curators who are most likely to resonate with your music</li>
                <li>At the end of the campaign, you'll receive a detailed report summarizing curator feedback, key insights, and actionable recommendations</li>
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
