
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  description,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Upgrade to Pro to {feature}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Pro plan includes:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Unlimited Smart Links</li>
              <li>• All Music Platforms</li>
              <li>• Advanced Analytics</li>
              <li>• Email Collection</li>
              <li>• Platform Reordering</li>
              <li>• Remove Branding</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/pricing")}
              className="w-full"
            >
              Upgrade Now
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
