
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface PasswordResetSuccessProps {
  onGoToLogin: () => void;
}

export function PasswordResetSuccess({ onGoToLogin }: PasswordResetSuccessProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Password Updated!</h1>
        <p className="text-sm text-muted-foreground">
          Your password has been successfully changed. 
          You can now login with your new password.
        </p>
      </div>
      
      <Button 
        className="w-full" 
        onClick={onGoToLogin}
      >
        Go to Login
      </Button>
    </div>
  );
}
