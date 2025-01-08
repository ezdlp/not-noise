import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CreateSmartLink = () => {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Create Your Smart Link</h1>
        <p className="text-muted-foreground mb-6">
          Start by searching for your track or entering your music details.
        </p>
        {/* Placeholder for the smart link creation wizard */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Smart link creation wizard coming soon...
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CreateSmartLink;