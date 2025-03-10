
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // This function now checks multiple sources for the token
    const detectRecoveryFlow = () => {
      // First check if we have a valid recovery flag in the URL hash
      if (window.location.hash.includes('recovery=true')) {
        console.log("Recovery flag found in URL hash");
        return true;
      }
      
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      if (type === 'recovery') {
        console.log("Recovery type found in URL parameters");
        return true;
      }
      
      return false;
    };

    // Initialize recovery flow detection
    setRecoveryFlow(detectRecoveryFlow());
    
    // Set up auth state change listener for recovery event
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY event detected");
        setRecoveryFlow(true);
        setIsVerifying(false);
      } else if (event === "SIGNED_IN" && !form.getValues('password')) {
        // If user is already logged in but hasn't set a password, consider them not in recovery flow
        setRecoveryFlow(false);
        setIsVerifying(false);
        navigate("/dashboard");
      }
    });

    // Check if user has an active recovery session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log("Current session:", data.session ? "Active" : "None");
        
        if (data.session && !recoveryFlow) {
          // User is signed in but not in recovery flow
          setIsVerifying(false);
          setRecoveryFlow(false);
        } else if (recoveryFlow) {
          // In recovery flow, ready for password update
          setIsVerifying(false);
        } else {
          // No active session and not in recovery flow
          setError("No active recovery session found. Please request a new password reset link.");
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError("Error checking authentication state. Please try again.");
        setIsVerifying(false);
      }
    };

    // Run the session check
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, form, recoveryFlow]);

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
      // Update user's password
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

      // Sign out after successful password update
      await supabase.auth.signOut();
      
      // Redirect to login page after a short delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("Update password error:", error);
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
