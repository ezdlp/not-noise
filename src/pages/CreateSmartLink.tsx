import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import SearchStep from "@/components/create-smart-link/SearchStep";
import DetailsStep from "@/components/create-smart-link/DetailsStep";
import PlatformsStep from "@/components/create-smart-link/PlatformsStep";
import MetaPixelStep from "@/components/create-smart-link/MetaPixelStep";
import EmailCaptureStep from "@/components/create-smart-link/EmailCaptureStep";
import ReviewStep from "@/components/create-smart-link/ReviewStep";
import { toast } from "sonner";

const CreateSmartLink = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({});

  const handleSearchComplete = (trackData: any) => {
    setData(trackData);
    setStep(2);
  };

  const handleDetailsComplete = (detailsData: any) => {
    setData({ ...data, ...detailsData });
    setStep(3);
  };

  const handlePlatformsComplete = (platformsData: any) => {
    setData({ ...data, ...platformsData });
    setStep(4);
  };

  const handleMetaPixelComplete = (metaPixelData: any) => {
    setData({ ...data, ...metaPixelData });
    setStep(5);
  };

  const handleEmailCaptureComplete = (emailCaptureData: any) => {
    setData({ ...data, ...emailCaptureData });
    setStep(6);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Here we would typically save the data to a backend
    console.log("Final smart link data:", data);
    toast.success("Smart link created successfully!");
    navigate("/dashboard");
  };

  const handleEditStep = (stepNumber: number) => {
    setStep(stepNumber);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Create Your Smart Link</h1>
            <span className="text-sm text-muted-foreground">
              Step {step} of 6
            </span>
          </div>
          <div className="w-full bg-secondary/20 h-2 rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
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
  );
};

export default CreateSmartLink;