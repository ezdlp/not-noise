
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for the password reset link.",
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Error sending reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold">Check Your Email</h2>
            <p className="mt-4 text-muted-foreground">
              We've sent a password reset link to:
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try another email address.
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setResetSent(false)}
              >
                Try another email
              </Button>
              
              <Button
                variant="link"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Reset Password</h2>
          <p className="mt-2 text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
