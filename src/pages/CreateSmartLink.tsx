import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import SearchStep from "@/components/create-smart-link/SearchStep";
import DetailsStep from "@/components/create-smart-link/DetailsStep";
import PlatformsStep from "@/components/create-smart-link/PlatformsStep";
import EmailCaptureStep from "@/components/create-smart-link/EmailCaptureStep";
import ReviewStep from "@/components/create-smart-link/ReviewStep";

const CreateSmartLink = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({});

  const handleNext = (stepData: any) => {
    setData({ ...data, ...stepData });
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <SearchStep onNext={handleNext} />;
      case 2:
        return (
          <DetailsStep
            initialData={data}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <PlatformsStep
            initialData={data}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <EmailCaptureStep
            initialData={data}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={data}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Create Your Smart Link</h1>
            <span className="text-sm text-muted-foreground">
              Step {step} of 5
            </span>
          </div>
          <div className="w-full bg-secondary/20 h-2 rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
        {renderStep()}
      </Card>
    </div>
  );
};

export default CreateSmartLink;