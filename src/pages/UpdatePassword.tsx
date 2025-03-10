
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const UpdatePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [isVerifying, setIsVerifying] = useState(true);
  const [recoveryFlow, setRecoveryFlow] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Function to extract recovery token from URL in different formats
  const extractRecoveryToken = () => {
    // Check for recovery in URL hash
    if (window.location.hash.includes('recovery=true')) {
      console.log("[Recovery] Found recovery flag in URL hash");
      return true;
    }
    
    // Check for recovery type in query params
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'recovery') {
      console.log("[Recovery] Found recovery type in URL params");
      return true;
    }

    // Look for access_token in query params that might be a recovery token
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');
    if (accessToken && tokenType === 'recovery') {
      console.log("[Recovery] Found recovery token in URL params");
      setRecoveryToken(accessToken);
      return true;
    }

    return false;
  };

  useEffect(() => {
    console.log("[UpdatePassword] Component mounted, current URL:", window.location.href);
    
    // First check if this is a recovery flow based on URL
    const isRecoveryFlow = extractRecoveryToken();
    setRecoveryFlow(isRecoveryFlow);
    
    const verifySession = async () => {
      try {
        // Try to extract and use access token from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        
        if (accessToken) {
          console.log("[Recovery] Found access_token in URL, attempting to exchange for session");
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(accessToken);
            if (error) {
              console.error("[Recovery] Failed to exchange token:", error);
              throw error;
            }
            console.log("[Recovery] Successfully exchanged token for session");
            setRecoveryFlow(true);
            setIsVerifying(false);
            return;
          } catch (tokenError) {
            console.error("[Recovery] Token exchange error:", tokenError);
          }
        }
        
        // Check if we have an active session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[Recovery] Current session:", session ? "Active" : "None");
        
        // If we have a session and it's a recovery flow, proceed
        if (session && isRecoveryFlow) {
          console.log("[Recovery] Valid recovery session found");
          setIsVerifying(false);
          return;
        } 
        // If we have a session but not in recovery flow, redirect to dashboard
        else if (session && !isRecoveryFlow) {
          console.log("[Recovery] Not in recovery flow but has session, redirecting");
          navigate("/dashboard");
          return;
        }
        // If we're in recovery flow but no session, still allow to proceed (might be using token)
        else if (isRecoveryFlow) {
          console.log("[Recovery] In recovery flow but no session yet");
          setIsVerifying(false);
          return;
        }
        // No session and not in recovery flow
        else {
          console.log("[Recovery] No active recovery session");
          setError("No active recovery session found. Please request a new password reset link.");
          setIsVerifying(false);
          return;
        }
      } catch (error) {
        console.error("[Recovery] Verification error:", error);
        setError("Error checking authentication state. Please request a new password reset link.");
        setIsVerifying(false);
      }
    };
    
    // Listen for auth state changes, particularly for PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Recovery] Auth event:", event, "Session:", session ? "exists" : "none");
      
      if (event === "PASSWORD_RECOVERY") {
        console.log("[Recovery] PASSWORD_RECOVERY event detected");
        setRecoveryFlow(true);
        setIsVerifying(false);
      }
      // If user signs in but not via recovery, redirect them
      else if (event === "SIGNED_IN" && !isRecoveryFlow) {
        console.log("[Recovery] User signed in but not in recovery flow");
        navigate("/dashboard");
      }
    });

    verifySession();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, location]);

  const checkPasswordRequirements = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    setPasswordRequirements(requirements);

    let strength = 0;
    if (requirements.minLength) strength += 25;
    if (requirements.hasUppercase) strength += 25;
    if (requirements.hasLowercase) strength += 25;
    if (requirements.hasNumber) strength += 25;
    setPasswordStrength(strength);

    return requirements;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (passwordStrength < 75) {
      setError("Password is not strong enough");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Recovery] Updating password...");
      
      // Exchange recovery token if we have one but no session
      if (recoveryToken) {
        console.log("[Recovery] Attempting to use recovery token directly");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryToken);
        if (exchangeError) {
          console.error("[Recovery] Failed to use recovery token:", exchangeError);
        } else {
          console.log("[Recovery] Successfully used recovery token");
        }
      }

      // Get the current session to check if we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Auth session missing!");
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });

      console.log("[Recovery] Password updated successfully, signing out...");
      await supabase.auth.signOut();
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("[Recovery] Update password error:", error);
      setError(`Error updating password: ${error.message}. Please try again or request a new password reset link.`);
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthLayout>
        <div className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Verifying Your Link</h2>
          <p className="text-sm text-muted-foreground">Please wait while we verify your password reset link...</p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!recoveryFlow) {
    return (
      <AuthLayout>
        <div className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Password Reset Error</h2>
          <p className="text-sm text-muted-foreground">
            {error || "No active recovery session found. Please request a new password reset link."}
          </p>
          <Button
            className="w-full"
            onClick={() => navigate("/reset-password")}
          >
            Request New Reset Link
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Update Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkPasswordRequirements(e.target.value);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <Progress 
                    value={passwordStrength} 
                    className="h-1" 
                    style={{
                      backgroundColor: '#ECE9FF',
                      '--progress-background': '#6851FB'
                    } as React.CSSProperties} 
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'hasUppercase', label: 'One uppercase letter' },
                      { key: 'hasLowercase', label: 'One lowercase letter' },
                      { key: 'hasNumber', label: 'One number' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 ${
                          passwordRequirements[key as keyof typeof passwordRequirements]
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default UpdatePassword;
