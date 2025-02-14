
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export function AuthRequiredModal({ isOpen, onClose, redirectPath }: AuthRequiredModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (redirectPath) {
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
    }
    navigate('/login');
  };

  const handleRegister = () => {
    if (redirectPath) {
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
    }
    navigate('/register');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ready to publish your smart link?</DialogTitle>
          <DialogDescription>
            Create an account or log in to publish and share your smart link. Your progress will be saved.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Why create an account?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share your music across all platforms</li>
              <li>• Track performance and analytics</li>
              <li>• Customize your landing pages</li>
              <li>• Manage all your smart links in one place</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleLogin}>
            Log in
          </Button>
          <Button onClick={handleRegister}>
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
