import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import SearchStep from "@/components/create-smart-link/SearchStep";
import DetailsStep from "@/components/create-smart-link/DetailsStep";
import PlatformsStep from "@/components/create-smart-link/PlatformsStep";
import MetaPixelStep from "@/components/create-smart-link/MetaPixelStep";
import EmailCaptureStep from "@/components/create-smart-link/EmailCaptureStep";
import ReviewStep from "@/components/create-smart-link/ReviewStep";
import { PreviewBanner } from "@/components/create-smart-link/PreviewBanner";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/services/analytics";

const CreateSmartLink = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem('pendingSmartLink');
      if (savedData) {
        console.log('Found saved smart link data');
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
        setStep(6);
        setTimeout(() => {
          console.log('Removing saved smart link data');
          sessionStorage.removeItem('pendingSmartLink');
        }, 500);
      }
    } catch (error) {
      console.error('Error loading saved smart link data:', error);
      toast.error('Error loading saved data. Please try again.');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateData = (newData: any) => {
    console.log('Updating data:', { current: data, new: newData });
    setData(prevData => ({ ...prevData, ...newData }));
  };

  const handleSearchComplete = (trackData: any) => {
    analytics.trackSmartLinkCreationStep(1, true, { content_type: trackData.content_type });
    updateData(trackData);
    setStep(2);
  };

  const handleDetailsComplete = (detailsData: any) => {
    analytics.trackSmartLinkCreationStep(2, true, { has_custom_url: !!detailsData.slug });
    updateData(detailsData);
    setStep(3);
  };

  const handlePlatformsComplete = (platformsData: any) => {
    analytics.trackSmartLinkCreationStep(3, true, { 
      platform_count: platformsData.platforms?.filter((p: any) => p.enabled).length 
    });
    updateData(platformsData);
    setStep(4);
  };

  const handleMetaPixelComplete = (metaPixelData: any) => {
    analytics.trackSmartLinkCreationStep(4, true, { 
      pixel_enabled: metaPixelData.metaPixel?.enabled 
    });
    updateData(metaPixelData);
    setStep(5);
  };

  const handleEmailCaptureComplete = (emailCaptureData: any) => {
    analytics.trackSmartLinkCreationStep(5, true, { 
      email_capture_enabled: emailCaptureData.email_capture_enabled 
    });
    updateData(emailCaptureData);
    setStep(6);
  };

  const handleBack = () => {
    if (step > 1) {
      analytics.trackSmartLinkCreationStep(step - 1, true, { direction: 'back' });
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const enabledPlatforms = data.platforms?.filter((p: any) => p.enabled) || [];
    analytics.trackSmartLinkCreationComplete(enabledPlatforms.length, {
      content_type: data.content_type,
      has_meta_pixel: !!data.metaPixel?.enabled,
      has_email_capture: !!data.email_capture_enabled
    });
    
    console.log("Final smart link data:", data);
    toast.success("Smart link created successfully!");
    navigate("/dashboard");
  };

  const handleEditStep = (stepNumber: number) => {
    analytics.trackSmartLinkCreationStep(stepNumber, true, { 
      edit_from_step: step,
      direction: 'edit' 
    });
    setStep(stepNumber);
  };

  return (
    <>
      {!isAuthenticated && <PreviewBanner />}
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <Card className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold">Create Your Smart Link</h1>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Step {step} of 6
              </span>
            </div>
            <Progress 
              value={(step / 6) * 100} 
              className="h-2 [&>div]:bg-primary [&:not([data-state='complete'])]:bg-primary/10"
            />
          </div>

          {step === 1 && <SearchStep onNext={handleSearchComplete} />}
          {step === 2 && (
            <DetailsStep
              initialData={data}
              onNext={handleDetailsComplete}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <PlatformsStep
              initialData={data}
              onNext={handlePlatformsComplete}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <MetaPixelStep
              initialData={data}
              onNext={handleMetaPixelComplete}
              onBack={handleBack}
            />
          )}
          {step === 5 && (
            <EmailCaptureStep
              initialData={data}
              onNext={handleEmailCaptureComplete}
              onBack={handleBack}
            />
          )}
          {step === 6 && (
            <ReviewStep
              data={data}
              onBack={handleBack}
              onComplete={handleComplete}
              onEditStep={handleEditStep}
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default CreateSmartLink;
