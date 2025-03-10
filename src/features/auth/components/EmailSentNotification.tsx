
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

interface EmailSentNotificationProps {
  email: string;
  onTryAnotherEmail: () => void;
  onBackToLogin: () => void;
}

export function EmailSentNotification({ 
  email, 
  onTryAnotherEmail, 
  onBackToLogin 
}: EmailSentNotificationProps) {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Check Your Email</h2>
        <p className="text-muted-foreground">
          We've sent a password reset link to:
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or try another email address.
        </p>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={onTryAnotherEmail}
          >
            Try another email
          </Button>
          
          <Button
            variant="link"
            className="w-full"
            onClick={onBackToLogin}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
